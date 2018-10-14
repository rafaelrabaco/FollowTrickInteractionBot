"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var TwitterClient_1 = require("./TwitterClient");
var bella_scheduler_1 = require("bella-scheduler");
var Bot = /** @class */ (function () {
    function Bot() {
        this.listName = process.env.LIST_NAME;
        this.listenersProfiles = [];
        this.queuedTweets = [];
        this.favoritedTweets = [];
        this.client = new TwitterClient_1.TwitterClient();
    }
    Bot.prototype.getListenerProfiles = function () {
        var _this = this;
        return this.client.listMembers(this.listName, this.client.username)
            .then(function (members) {
            members.map(function (member) { return _this.listenersProfiles.push(member.id_str); });
        })
            .then(function () { return console.log("INFO - Listening " + _this.listenersProfiles.length + " profiles..."); }).catch(function (err) {
            console.log(err);
        });
    };
    Bot.prototype.runQueue = function () {
        var _this = this;
        bella_scheduler_1.every('10s', function () {
            if (_this.queuedTweets.length) {
                _this.addFavorite(_this.queuedTweets[0]['id'], _this.queuedTweets[0]['text']);
                _this.queuedTweets.splice(0, 1);
            }
        });
    };
    Bot.prototype.addFavorite = function (id, text) {
        var _this = this;
        this.client.favoriteCreate(id)
            .then(function () {
            console.log("SUCCESS - Add favorite [" + id + "]");
            if (Boolean(process.env.ENABLE_FAVORITE_EXPIRE)) {
                _this.favoritedTweets.push({ 'id': id, 'text': text });
                bella_scheduler_1.once(process.env.EXPIRE_FAVORITE_MINUTES + "m", function () { return _this.removeFavorite(id); });
            }
        }).catch(function (err) {
            console.log("ERROR - Failed to add favorite [" + id + "] -> " + err.message);
        });
    };
    Bot.prototype.removeFavorite = function (id) {
        this.client.favoriteRemove(id)
            .then(function () { return console.log("SUCCESS - Remove favorite [" + id + "]"); })
            .catch(function (err) { return console.log("ERROR - Failed to remove favorite [" + id + "] -> " + err.message); });
        this.queuedTweets.splice(this.favoritedTweets.findIndex(function (x) { return x.id === id; }), 1);
    };
    Bot.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stream;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getListenerProfiles()];
                    case 1:
                        _a.sent();
                        this.runQueue();
                        console.log('SUCCESS - Bot started!');
                        stream = this.client.twitter.stream('statuses/filter', {
                            follow: this.listenersProfiles.join(',')
                        });
                        stream.on('tweet', function (tweet) {
                            if (!tweet.retweeted_status && _this.listenersProfiles.includes(tweet.user.id_str)) {
                                _this.queuedTweets.push({
                                    'id': tweet.id_str,
                                    'text': tweet.text
                                });
                            }
                        });
                        stream.on('error', function (err) {
                            console.log("ERROR - Failed to stream listening tweets");
                            console.log(err.message);
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    Bot.prototype.exitBot = function () {
        var _this = this;
        console.log("INFO - Stopping bot...");
        if (this.favoritedTweets.length) {
            bella_scheduler_1.every('1s', function () {
                _this.removeFavorite(_this.favoritedTweets[0]['id']);
                _this.favoritedTweets.splice(0, 1);
                if (!_this.favoritedTweets.length) {
                    console.log("SUCCESS - Bot Stopped!");
                    process.exit(1);
                }
            });
        }
        else {
            console.log("SUCCESS - Bot Stopped!");
            process.exit(1);
        }
    };
    return Bot;
}());
exports.Bot = Bot;
