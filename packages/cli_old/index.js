#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');

const { save, load } = require('./api');

program
  .command('push <file_name>')
  .description('File name of cwd to push to remote')
  .action(async (fileName) => {
    try {
      const fileContent = fs.readFileSync(fileName);
      const encoded = Buffer.from(fileContent).toString('base64');
      const id = await save(fileName, encoded);
      console.log(
        `File ${fileName} successfully pushed to remote.\n\nFile ID: ${id}`
      );
    } catch (error) {
      console.error(`Error uploading file: ${error}`);
    }
  });

program
  .command('pull <file_id>')
  .description('File id of remote to pull to cwd')
  .action(async (fileId) => {
    console.log(`Pulling ${fileId} to cwd`);

    try {
      const loaded = await load(fileId);
      if (!loaded) {
        console.error(`File ${fileId} not found.`);
        return;
      }
      const decoded = Buffer.from(encoded, 'base64');
      fs.writeFileSync(name + 2, decoded);
      console.log(`File ${name} successfully pulled to cwd.`);
    } catch (error) {
      console.error(`Error pulling file: ${error}`);
    }
  });

program.parse(process.argv);
