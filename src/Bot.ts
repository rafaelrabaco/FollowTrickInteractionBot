import { TwitterClient } from "./TwitterClient";
import { every, once } from 'bella-scheduler';

export class Bot {

    public client: TwitterClient;
    public listName: any = process.env.LIST_NAME;
    public listenersProfiles: Array<any> = []
    public queuedTweets: Array<any> = [];
    public favoritedTweets: Array<any> = [];

    constructor() {
        this.client = new TwitterClient();
    }

    getListenerProfiles() {
        return this.client.listMembers(this.listName, this.client.username)
            .then((members: any) => {
                members.map(member => this.listenersProfiles.push(member.id_str))
            })
            .then(() => console.log(`INFO - Listening ${this.listenersProfiles.length} profiles...`)
            ).catch((err: any) => {
                console.log(err);
            })

    }

    runQueue() {
        every('10s', () => {
            if (this.queuedTweets.length) {
                this.addFavorite(this.queuedTweets[0]['id'], this.queuedTweets[0]['text'])
                this.queuedTweets.splice(0, 1);
            }
        });
    }

    addFavorite(id: any, text: string) {
        this.client.favoriteCreate(id)
            .then(() => {
                console.log(`SUCCESS - Add favorite [${id}]`)
                if (Boolean(process.env.ENABLE_FAVORITE_EXPIRE)) {
                    this.favoritedTweets.push({ 'id': id, 'text': text })
                    once(`${process.env.EXPIRE_FAVORITE_MINUTES}m`, () => this.removeFavorite(id));
                }
            }).catch(err => {
                console.log(`ERROR - Failed to add favorite [${id}] -> ${err.message}`)
            })
    }

    removeFavorite(id: any) {
        this.client.favoriteRemove(id)
            .then(() => console.log(`SUCCESS - Remove favorite [${id}]`))
            .catch(err => console.log(`ERROR - Failed to remove favorite [${id}] -> ${err.message}`))
        this.queuedTweets.splice(this.favoritedTweets.findIndex(x => x.id === id), 1);
    }

    async run() {
        await this.getListenerProfiles();
        this.runQueue();
        console.log('SUCCESS - Bot started!');

        const stream = this.client.twitter.stream('statuses/filter', {
            follow: this.listenersProfiles.join(',')
        })

        stream.on('tweet', (tweet) => {
            if (!tweet.retweeted_status && this.listenersProfiles.includes(tweet.user.id_str)) {
                this.queuedTweets.push({
                    'id': tweet.id_str,
                    'text': tweet.text
                })
            }
        })

        stream.on('error', err => {
            console.log(`ERROR - Failed to stream listening tweets`)
            console.log(err.message);
        });
    }

    exitBot() {
        console.log("INFO - Stopping bot...")
        if (this.favoritedTweets.length) {
            every('1s', () => {
                this.removeFavorite(this.favoritedTweets[0]['id'])
                this.favoritedTweets.splice(0, 1);

                if (!this.favoritedTweets.length) {
                    console.log("SUCCESS - Bot Stopped!")
                    process.exit(1)
                }

            });
        }
        else {
            console.log("SUCCESS - Bot Stopped!")
            process.exit(1)
        }
    }

}