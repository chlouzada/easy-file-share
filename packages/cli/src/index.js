#!/usr/bin/env node
// @ts-check

import { program } from 'commander';
import { createReadStream, readdirSync, createWriteStream } from 'fs';
import { createServer } from 'http';
import { join } from 'path';
import { execa } from 'execa';
import axios from 'axios';
import inquirer from 'inquirer';

import { tunnel } from './helpers/tunnel.js';

const PORT = 8080;

program
  .command('serve')
  .description('Serve current directory')
  .action(async () => {
    try {
      const server = createServer((req, res) => {
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
      });
      server.listen(PORT, async () => {
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
    } catch (error) {
      console.error(`Error uploading file: ${error}`);
    }
  });

program
  .command('pull <key/url>')
  .description('Pull a file from a tunnel')
  .action(async (data) => {
    try {
      /** @type {string | null} */
      const baseUrl = data.startsWith('http') ? data : await tunnel.get(data);
      if (!baseUrl) {
        console.error(`No tunnel found with id ${data}`);
        return;
      }
      /** @type {string[] | null} */
      let files = null;
      try {
        const res = await axios.get(baseUrl);
        files = res.data;
      } catch (error) {
        console.log(error);
        console.error(`Error getting available files`);
        process.exit(1);
      }
      if (!files?.length) {
        console.error(`No files found.`);
        return;
      }
      const { file } = await inquirer.prompt([
        {
          type: 'list',
          name: 'file',
          message: 'Select a file to pull',
          choices: files,
        },
      ]);

      const { filename } = await inquirer.prompt([
        {
          type: 'input',
          name: 'filename',
          message:
            'Enter a new file name, or press enter to use the original file name:',
          default: file,
        },
      ]);

      const res = await axios.get(`${baseUrl}/${file}`, {
        responseType: 'stream',
      });

      res.data.pipe(createWriteStream(filename));
    } catch (error) {
      console.log(error);
      console.error('Unexpected error');
    }
  });

program.parse(process.argv);
