#!/usr/bin/env node
// @ts-check

import { program } from 'commander';
import { createWriteStream } from 'fs';
import axios from 'axios';
import inquirer from 'inquirer';

import { tunnel } from './helpers/tunnel.js';
import { server } from './helpers/server.js';
import { pull } from './helpers/pull.js';

program.command('serve').description('Serve current directory').action(server);

program
  .command('pull <key | url>')
  .description('Pull a file from a tunnel')
  .action(pull);

program.parse(process.argv);
