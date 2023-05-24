// @ts-check

import { createReadStream, readdirSync } from 'fs';
import { createServer } from 'http';
import { join } from 'path';
import { execa } from 'execa';
import ora from 'ora';

import { tunnel } from './tunnel.js';
import { logger } from './logger.js';

const PORT = 8080;

/** @type {string | null} */
let key = null;
/** @type {string | null} */
let id = null;

let dtFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
});

export const server = () => {
  createServer((req, res) => {
    /** @type {any} */
    const url = req.url;
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
    const stream = execa('ssh', [
      '-R',
      `80:localhost:${PORT}`,
      'localhost.run',
    ]).stdout;
    if (!stream) {
      return logger.error('Error creating tunnel');
    }
    stream.on('data', async (chunk) => {
      /** @type {string[] | null} */
      const match = chunk
        .toString()
        .match(
          /\bhttps?:\/\/(?:[\w-]+\.)*[\w-]+(?:\.[a-zA-Z]{2,})+(?:\/(?:[^\s/$.?#]+\/?)*(?:\?[^\s/?#]+)?(?:#[^\s#]*)?)?/
        );
      if (!match || !match.length) {
        logger.info(chunk.toString());
        return logger.error("Couldn't parse tunnel url");
      }
      /** @type {string} */
      const url = match[0];
      if (id) {
        tunnel.update(id, url);
      } else {
        const created = await tunnel.create(url);
        id = created.id;
        key = created.key;
        spinner.stop();
        logger.success('Tunnel created successfully\n');
        logger.info('Key:', key);
      }
      logger.info('URL:', url);
    });
  });
};
