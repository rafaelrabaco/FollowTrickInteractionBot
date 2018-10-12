import { TwitterClient } from "./twitter";
import moment from "moment";

export class Bot {

    constructor() {
        this.client = new TwitterClient();
        this.profilesIds = [];
        this.favoritedTweets = [];
        this.enableFavoriteExpire = process.env.ENABLE_FAVORITE_EXPIRE;
        this.maxFavoriteTime = process.env.EXPIRE_FAVORITE_MINUTES;
    }

    processFollowTrickProfiles() {
        return this.client.listMembers(process.env.LIST_NAME)
            .then(members => {
                members.map(member => this.profilesIds.push(member.id_str))
            }).catch(err => {
                console.log(err);
            })
    }

    expireFavorite() {
        if (this.favoritedTweets)
            this.favoritedTweets.map((tweet, index) => {
                let currentTime = moment.duration(moment().diff(tweet.time)).asMinutes()
                if (currentTime >= this.maxFavoriteTime)
                    this.client.favoriteRemove(tweet.id)
                        .then(() => {
                            console.log(`SUCCESS - Remove favorite tweet [${tweet.id}]`);
                            delete this.favoritedTweets[index];
                        }).catch(err => {
                            console.log(`ERROR - Failed to remove favorite tweet [${tweet.id}]`);
                            console.log(err)
                        })
            })
        setTimeout(() => { this.expireFavorite() }, 5 * 1000);
    }

    exitBot() {
        console.log("INFO - Running clean...")
        if (this.favoritedTweets) {
            this.favoritedTweets.map(async (tweet, index) => {
                this.client.favoriteRemove(tweet.id)
                    .then(() => {
                        delete this.favoritedTweets[index];
                    })
                    .then(() => {
                        if ((index + 1) === this.favoritedTweets.length)
                            process.exit(1)
                    })
                    .catch(err => {
                        console.log(`ERROR - Failed to remove favorite tweet [${tweet.id}] -> ${err.message}`);
                        if ((index + 1) === this.favoritedTweets.length)
                            process.exit(1)
                    })
            })
        }
        else {
            process.exit(1)
        }
    }

    async run() {
        await this.processFollowTrickProfiles();
        console.log(`INFO - Listening ${this.profilesIds.length} profiles...`)

        this.client.twitter.stream('statuses/filter', {
            follow: this.profilesIds.join(',')
        }, stream => {
            stream.on('data', tweet => {
                if (!tweet.retweeted_status && this.profilesIds.includes(tweet.user.id_str)) {
                    setTimeout(() => {
                        this.client.favoriteCreate(tweet.id_str)
                            .then(() => {
                                console.log(`SUCCESS - Add favorite tweet [${tweet.id_str}]`)
                                this.favoritedTweets.push({
                                    'id': tweet.id_str,
                                    'text': tweet.text,
                                    'time': moment()
                                })
                            }).catch(err => {
                                console.log(`ERROR - Failed to add favorite tweet [${tweet.id_str}]`)
                                console.log(err)
                            })
                    }, 15000) // 15 SECONDS
                }
            });
            stream.on('error', err => {
                console.log(`ERROR - Failed to stream listening tweets`)
                console.log(err.message);
            });
        });

        if (this.enableFavoriteExpire)
            this.expireFavorite();
    }
}