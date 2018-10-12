import { Bot } from './bot';
import * as dotenv from "dotenv";
dotenv.config();


const packageJson = require('../package.json');
console.log(`FollowTrickBot v${packageJson.version}`);
console.log('INFO - Starting bot...');

export const server = new Bot();
server.run();

process.stdin.resume(); // The program will not close instantly
process.on('SIGINT', () => { server.exitBot() });
process.on('SIGUSR1', () => { server.exitBot() });
process.on('SIGUSR2', () => { server.exitBot() });
process.on('uncaughtException', () => { server.exitBot() });