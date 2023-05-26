// @ts-check

import ora from 'ora';
import { createWriteStream } from 'fs';
import axios from 'axios';
import inquirer from 'inquirer';

import { tunnel } from './tunnel.js';
import { logger } from './logger.js';

/**
 *  @param {string[]} files
 *  @returns {Promise<{file: string; filename: string}>}
 */
const inquire = async (files) => {
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
  return { file, filename };
};

/**
 *
 * @param {string} data
 * @param {{password?: string} | undefined} options
 * @returns void
 */
export const pull = async (data, options) => {
  try {
    /** @type {string | null} */
    const baseUrl = data.startsWith('http') ? data : await tunnel.get(data);
    if (!baseUrl) {
      return logger.error(`No tunnel found with id ${data}`);
    }
    /** @type {string[] | null} */
    let files = null;
    try {
      const res = await axios.get(baseUrl, {
        headers: {
          'x-password': options?.password,
        },
      });
      files = res.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return logger.error('Incorrect password');
      }
      logger.warn(error);
      return logger.error('Error fetching files');
    }
    if (!files?.length) {
      return logger.error(`No files found.`);
    }

    const { file, filename } = await inquire(files);

    const res = await axios.get(`${baseUrl}/${file}`, {
      responseType: 'stream',
      headers: {
        'x-password': options?.password,
      },
    });
    res.data.pipe(createWriteStream(filename));
  } catch (error) {
    if (error.response.status === 401) {
      return logger.error('Incorrect password');
    }
    logger.warn(error);
    logger.error('Unexpected error');
  }
};
