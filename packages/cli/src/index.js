#!/usr/bin/env node
// @ts-check

import { program } from 'commander';
import latestVersion from 'latest-version';

import { serve } from './helpers/serve.js';
import { pull } from './helpers/pull.js';
import { logger } from './helpers/logger.js';
import { VERSION } from './constants/version.js';

program
  .name('easy-file-share')
  .description('Share files easily')
  .version(VERSION);

program
  .command('serve')
  .option('-p, --password <password>', 'Password')
  .action(serve);

program
  .command('pull')
  .argument('<key>', 'Key or URL')
  .option('-p, --password <password>', 'Password')
  .description('Pull a file from a tunnel')
  .action(pull);

program
  .hook('preAction', async () => {
    const latest = await latestVersion('easy-file-share');
    VERSION !== latest &&
      logger.warn(
        `A new version (${latest}) is available. Please consider upgrading using npm install -g easy-file-share@latest`
      );
  })
  .parse(process.argv);
