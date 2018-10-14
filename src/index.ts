import * as dotenv from "dotenv";
import { Bot } from "./Bot";
dotenv.config();

const packageJson = require('../package.json');
console.log(`FollowTrickInteractionBot v${packageJson.version}`);
console.log('INFO - Starting bot...');

const server: Bot = new Bot();
server.run();

process.stdin.resume(); // The program will not close instantly
process.on('SIGINT', () => { server.exitBot() });
process.on('SIGUSR1', () => { server.exitBot() });
process.on('SIGUSR2', () => { server.exitBot() });
process.on('uncaughtException', () => { server.exitBot() });