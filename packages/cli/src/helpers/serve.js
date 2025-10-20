// @ts-check

import { createReadStream, readdirSync } from 'fs';
import { createServer } from 'http';
import { join } from 'path';
import { execa } from 'execa';
import ora from 'ora';
import TrackerClient from 'bittorrent-tracker';
import crypto from 'crypto';

import { tunnel } from './tunnel.js';
import { logger } from './logger.js';

const PORT = 8080;

/** @type {string | undefined} */
let password;
/** @type {string | undefined} */
let key;
/** @type {string | undefined} */
let id;

let dtFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
});

/** @param {import('http').IncomingHttpHeaders} headers */
const isAuthed = (headers) => {
  if (!password) return true;
  const auth = headers['x-password'];
  if (!auth) return false;
  return auth === password;
};

/** @param {{ password?: string }} options */
export const serve = (options) => {
  password = options.password;
  createServer((req, res) => {
    if (!isAuthed(req.headers)) {
      logger.warn(`${dtFormatter.format(new Date())} | Unauthorized request`);
      res.writeHead(401);
      res.end();
      return;
    }
    const url = /** @type {string} */ (req.url);
    if (url === '/') {
      const filenames = readdirSync(process.cwd());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(filenames));
      return;
    }
    const filePath = join(process.cwd(), url);
    const fileStream = createReadStream(filePath);
    fileStream.on('error', () => {
      res.writeHead(404);
      res.end();
    });
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    fileStream.pipe(res);
    logger.info(`${dtFormatter.format(new Date())} | Served ${url}`);
  }).listen(PORT, async () => {
    const spinner = ora('Initializing tunnel').start();
    const { stdout, stderr } = execa('ssh', [
      '-tt',
      '-R',
      `80:localhost:${PORT}`,
      '-o',
      'StrictHostKeyChecking=no',
      'localhost.run',
    ]);

    if (!stdout || !stderr) {
      return logger.error('Error creating tunnel');
    }

    stderr.on('data', (data) => {
      const isWithoutSshKey = data
        .toString()
        .includes('Permission denied (publickey).');
      if (isWithoutSshKey) {
        spinner.stop();
        return logger.error('Please, add your ssh key to your ssh-agent');
      }
    });

    /** @type {TrackerClient | undefined} */
    let tracker

    stdout.on('data', async (chunk) => {
      /** @type {string[] | null} */
      const match = chunk
        .toString()
        .match(
          /\bhttps?:\/\/(?:[\w-]+\.)*[\w-]+(?:\.[a-zA-Z]{2,})+(?:\/(?:[^\s/$.?#]+\/?)*(?:\?[^\s/?#]+)?(?:#[^\s#]*)?)?/
        );
      if (!match || !match.length) return;
      /** @type {string} */
      const url = match[0]

      
        if(tracker) {
          tracker.destroy()
        }

      const key = generateShareKey();
      const prefix = url.replace('https://', '').split('.')[0];
      

      tracker = initTracker({key, prefix});
      tracker.start({});

      logger.success('Tunnel created successfully\n');
      logger.info('Key:', key);
      logger.info('URL:', url);
    });
  });
};

const BASE_INFOHASH = Buffer.from("efs0000000000000", "utf8");
function generateShareKey() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let key = "";
  for (let i = 0; i < 4; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}
/** @param {string} key */
function createInfoHash(key) {
  const combined = Buffer.concat([BASE_INFOHASH, Buffer.from(key, "utf8")]);
  return combined;
}

/** @param {{ key: string, prefix?: string }} options */
export const initTracker = ({key,prefix = ''}) => {
  const infoHash = createInfoHash(key);
  const peerId = [...Buffer.from(prefix) , ...Buffer.from("@"), ...crypto.randomBytes(20  - 1 - prefix.length)];
  // FIXME: throw ERR_ICE_CONNECTION_CLOSED 
  const tracker = new TrackerClient({
    infoHash: infoHash,
    peerId: peerId,
    announce: ["wss://sd-production-17a2.up.railway.app"],
    port: 6881,
  })
  return tracker;
}