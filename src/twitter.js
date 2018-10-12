import Twitter from 'twitter';

export class TwitterClient {
    constructor() {
        this.twitter = new Twitter({
            consumer_key: process.env.TWITTER_CONSUMER_KEY,
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
            access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
            access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
        });
        this.userId = process.env.TWITTER_ACCESS_TOKEN_KEY.split('-')[0]
    }

    userLookup(screen_name) {
        return new Promise((resolve, reject) => {
            this.twitter.get('users/lookup', { 'screen_name': screen_name }, (error, user) => {
                if (error)
                    return reject(error);

                return resolve(user[0]);
            });
        });
    }

    listMembers(slug) {
        return new Promise((resolve, reject) => {
            this.twitter.get('lists/members', { 'slug': slug, 'owner_id': this.userId }, (error, members) => {
                if (error)
                    return reject(error);

                return resolve(members['users']);
            });
        });
    }

    favoriteCreate(tweet_id) {
        return new Promise((resolve, reject) => {
            this.twitter.post('favorites/create', { 'id': tweet_id }, (error, response) => {
                if (error)
                    return reject(error);

                return resolve(true);
            });
        });
    }

    favoriteRemove(tweet_id) {
        return new Promise((resolve, reject) => {
            this.twitter.post('favorites/destroy', { 'id': tweet_id }, (error, response) => {
                if (error)
                    return reject(error);

                return resolve(true);
            });
        });
    }
}