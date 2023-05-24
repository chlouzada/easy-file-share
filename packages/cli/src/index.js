#!/usr/bin/env node
// @ts-check

import { program } from 'commander';
import { createWriteStream } from 'fs';
import axios from 'axios';
import inquirer from 'inquirer';

import { tunnel } from './helpers/tunnel.js';
import { server } from './helpers/server.js';

const PORT = 8080;

program.command('serve').description('Serve current directory').action(server);

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
