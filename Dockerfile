FROM node:22

WORKDIR /app

COPY . .

RUN yarn install && yarn build

RUN rm -rf /build

RUN mkdir /data/

EXPOSE 3000

ENV FEEDGEN_PORT=3000

# Change this to use a different bind address
ENV FEEDGEN_LISTENHOST="0.0.0.0"
# Set to something like db.sqlite to store persistently
ENV FEEDGEN_SQLITE_LOCATION="/data/db.sqlite"
# FEEDGEN_SQLITE_LOCATION=":memory:"
# Don't change unless you're working in a different environment than the primary Bluesky network
ENV FEEDGEN_SUBSCRIPTION_ENDPOINT="wss://bsky.network"
# Hostname
ENV FEEDGEN_HOSTNAME="ec2-34-202-236-64.compute-1.amazonaws.com"
# Set this to the DID of the account you'll use to publish the feed
# Bluesky DID of benrogboe
ENV FEEDGEN_PUBLISHER_DID="did:plc:itd44pixnah6bg4ktopdnzjd"
# Only use this if you want a service did different from did:web
# FEEDGEN_SERVICE_DID="did:plc:abcde..."
# Delay between reconnect attempts to the firehose subscription endpoint (in milliseconds)
ENV FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY=3000

CMD ["node", "/app/dist/index.js"]
