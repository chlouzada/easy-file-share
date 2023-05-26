#!/usr/bin/env node
// @ts-check

import { program } from 'commander';

import { server } from './helpers/server.js';
import { pull } from './helpers/pull.js';

program
  .command('serve')
  .option('-p, --password <password>', 'Password')
  .action(server);

program
  .command('pull')
  .argument('<key>', 'Key or URL')
  .option('-p, --password <password>', 'Password')
  .description('Pull a file from a tunnel')
  .action(pull);

program.parse(process.argv);
