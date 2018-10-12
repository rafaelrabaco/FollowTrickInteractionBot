import { Bot } from './bot';
import * as dotenv from "dotenv";
dotenv.config();


const packageJson = require('../package.json');
console.log(`FollowTrickBot v${packageJson.version}`);
console.log('INFO - Starting bot...');

export const server = new Bot();
server.run();