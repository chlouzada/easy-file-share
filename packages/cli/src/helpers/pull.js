// @ts-check

import ora from 'ora';
import { createWriteStream } from 'fs';
import axios from 'axios';
import inquirer from 'inquirer';

import { tunnel } from './tunnel.js';
import { logger } from './logger.js';

/**
 *
 * @param {string} data
 * @returns void
 */
export const pull = async (data) => {
  try {
    /** @type {string | null} */
    const baseUrl = data.startsWith('http') ? data : await tunnel.get(data);
    if (!baseUrl) {
      return logger.error(`No tunnel found with id ${data}`);
    }
    /** @type {string[] | null} */
    let files = null;
    try {
      const res = await axios.get(baseUrl);
      files = res.data;
    } catch (error) {
      logger.warn(error);
      return logger.error('Error fetching files');
    }
    if (!files?.length) {
      return logger.error(`No files found.`);
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
    logger.warn(error);
    logger.error('Unexpected error');
  }
};
