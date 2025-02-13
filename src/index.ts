import dotenv from 'dotenv'
import {BskyAgent} from '@atproto/api' //for DID resolution
import FeedGenerator from './server'

 dotenv.config()

 //hardcoded accounts for testing
 const ACCOUNTS = [
  'mjecsmap.bsky.social',
  'tiagoventura.bsky.social',
  'cbarrie.bsky.social',
  'jatucker.bsky.social',
  'benguinaudeau.bsky.social',
  'solmg.bsky.social',
]

// Function to resolve handles to DIDs
const resolveHandlesToDids = async (handles: string[]): Promise<string[]> => {
  const agent = new BskyAgent({ service: 'https://bsky.social' })
  const resolvedDids: string[] = []

  for (const handle of handles) {
    try {
      const result = await agent.resolveHandle({ handle })
      console.log(`Resolved ${handle} -> ${result.data.did}`)
      resolvedDids.push(result.data.did)
    } catch (err) {
      console.error(`❌ Failed to resolve handle '${handle}':`, err)
    }
  }

  return resolvedDids
}

const run = async () => {
  const hostname = maybeStr(process.env.FEEDGEN_HOSTNAME) ?? 'example.com'
  const serviceDid =
    maybeStr(process.env.FEEDGEN_SERVICE_DID) ?? `did:web:${hostname}`
  // Resolve handles to DIDs before creating the server
  console.log(`Resolving handles to DIDs...`)
  const allowedDids = await resolveHandlesToDids(ACCOUNTS)
  console.log(`Final allowed DIDs:`, allowedDids)
  const server = FeedGenerator.create({
    port: maybeInt(process.env.FEEDGEN_PORT) ?? 3000,
    listenhost: maybeStr(process.env.FEEDGEN_LISTENHOST) ?? 'localhost',
    sqliteLocation: maybeStr(process.env.FEEDGEN_SQLITE_LOCATION) ?? ':memory:',
    subscriptionEndpoint:
      maybeStr(process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT) ??
      'wss://bsky.network',
    publisherDid:
      maybeStr(process.env.FEEDGEN_PUBLISHER_DID) ?? 'did:example:alice',
    subscriptionReconnectDelay:
      maybeInt(process.env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY) ?? 3000,
    hostname,
    serviceDid,
    allowedDids, // Pass the resolved DIDs
  })
  await server.start()
  console.log(
    `🤖 running feed generator at http://${server.cfg.listenhost}:${server.cfg.port}`,
  )
}

const maybeStr = (val?: string) => {
  if (!val) return undefined
  return val
}

const maybeInt = (val?: string) => {
  if (!val) return undefined
  const int = parseInt(val, 10)
  if (isNaN(int)) return undefined
  return int
}

run()
