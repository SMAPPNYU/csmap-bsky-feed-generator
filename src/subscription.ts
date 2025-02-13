import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import { Database } from './db' // Import database connection

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  private db: Database
  private allowedDids: string[]

  constructor(db: Database, subscriptionEndpoint: string, allowedDids: string[]) {
    super()
    this.db = db
    this.allowedDids = allowedDids
  }


  async handleEvent(evt: RepoEvent) {
    //process commit events	  
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)
    const authorDid = evt.repo // The DID of the user making this commi

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    for (const post of ops.posts.creates) {
      console.log(post.record.text)
    }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    
      if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        //retrieve text
	const text = create.record.text?.toLowerCase() || ''
	const isFromAllowedAuthor = this.allowedDids.includes(authorDid)
	const containsPolitics = text.includes('#politics')
        // Keep the post if either condition is met
        return isFromAllowedAuthor || containsPolitics
      })
      .map((create) => ({
        // map relevant  posts to a db row
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
	  text: create.record.text,
      }))
    /*
    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
   */
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
