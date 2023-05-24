// @ts-check

import { createReadStream, readdirSync,  } from 'fs';
import { createServer } from 'http';
import { join } from 'path';
import { execa } from 'execa';

import { tunnel } from './tunnel.js';



const PORT = 8080;

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
    fileStream.on('error', (error) => {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    });
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    fileStream.pipe(res);
  }).listen(PORT, async () => {
    const stream = execa('ssh', [
      '-R',
      `80:localhost:${PORT}`,
      'localhost.run',
    ]).stdout;
    if (!stream) {
      console.error('Error creating tunnel');
      process.exit(1);
    }
    /** @type {string | null} */
    let id = null;
    stream.on('data', async (chunk) => {
      /** @type {string[] | null} */
      const match = chunk
        .toString()
        .match(
          /\bhttps?:\/\/(?:[\w-]+\.)*[\w-]+(?:\.[a-zA-Z]{2,})+(?:\/(?:[^\s/$.?#]+\/?)*(?:\?[^\s/?#]+)?(?:#[^\s#]*)?)?/
        );
      if (!match || !match.length) {
        console.log(chunk.toString());
        console.error("Couldn't parse tunnel url");
        process.exit(1);
      }
      /** @type {string} */
      const url = match[0];
      if (!id) {
        console.log('Tunnel created successfully');
        const created = await tunnel.create(url);
        id = created.id;
        console.log(`\nKey: ${created.key}`);
      } else {
        tunnel.update(id, url);
      }
      console.log(`URL: ${url}`);
    });
  });
};
