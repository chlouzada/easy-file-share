#!/usr/bin/env node
// @ts-check

import { program } from 'commander';
import {
  existsSync,
  createReadStream,
  readdirSync,
  writeFileSync,
  createWriteStream,
} from 'fs';
import { createServer } from 'http';
import { join } from 'path';
import { execSync, spawn } from 'child_process';
import { execa } from 'execa';
import axios from 'axios';
import inquirer from 'inquirer';

const baseUrl = 'https://easy-file-share.vercel.app';
// const baseUrl = 'http://localhost:3001';

const tunnel = {
  /**
   * @param {string} id
   * @returns {Promise<string | null>}
   */
  get: async (id) => {
    try {
      const res = await axios.get(`${baseUrl}/api/tunnels/${id}`);
      return res.data.url;
    } catch (error) {
      if (error.response.status === 404) {
        return null;
      } else {
        throw error;
      }
    }
  },

  /**
   * @param {string} id
   * @param {string} url
   * @returns {Promise<string | null>}
   */
  update: async (id, url) => {
    try {
      const res = await axios.put(`${baseUrl}/api/tunnels/${id}`, {
        url,
      });
      return res.data.id;
    } catch (error) {
      if (error.response.status === 404) {
        return null;
      } else {
        throw error;
      }
    }
  },

  /**
   * @param {string} url
   * @returns {Promise<string>}
   */
  create: async (url) => {
    const res = await axios.post(`${baseUrl}/api/tunnels`, {
      url,
    });
    return res.data.id;
  },
};

program
  .command('serve')
  .description('Serve current directory')
  .action(async () => {
    try {
      const server = createServer((req, res) => {
        if (req.url === '/') {
          const filenames = readdirSync(process.cwd());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(filenames));
          return;
        }

        // @ts-ignore
        const filePath = join(process.cwd(), req.url);
        const fileStream = createReadStream(filePath);
        fileStream.on('error', (error) => {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File not found');
        });

        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        fileStream.pipe(res);
      });

      const port = 8080;
      server.listen(port, async () => {
        const stream = execa('ssh', [
          '-R',
          '80:localhost:8080',
          'localhost.run',
        ]).stdout;

        let id = null;

        // @ts-ignore
        stream.on('data', async (chunk) => {
          const regex =
            /\bhttps?:\/\/(?:[\w-]+\.)*[\w-]+(?:\.[a-zA-Z]{2,})+(?:\/(?:[^\s/$.?#]+\/?)*(?:\?[^\s/?#]+)?(?:#[^\s#]*)?)?/;
          const match = chunk.toString().match(regex);
          if (match) {
            console.log('Tunnel created successfully');
            const url = match[0];
            console.log(`URL: ${url}`);
            if (!id) {
              id = await tunnel.create(url);
              console.log(`ID: ${id}`);
            } else {
              tunnel.update(id, url);
            }
          }
        });
      });
    } catch (error) {
      console.error(`Error uploading file: ${error}`);
    }
  });

program
  .command('pull <id/url>')
  .description('Pull a file from a tunnel')
  .action(async (data) => {
    try {
      const baseUrl = data.startsWith('http') ? data : await tunnel.get(data);

      if (!baseUrl) {
        console.error(`No tunnel found with id ${data}`);
        return;
      }

      let files = null;
      try {
        files = await axios.get(baseUrl);
      } catch (error) {
        console.log(error);
        console.error(`Error getting available files`);
        process.exit(1);
      }

      if (!files.data.length) {
        console.error(`No files found.`);
        return;
      }

      const { file } = await inquirer.prompt([
        {
          type: 'list',
          name: 'file',
          message: 'Select a file to pull',
          choices: files.data,
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
