const fs =  require('fs');

const packageJson = JSON.parse(fs.readFileSync('./packages/cli/package.json', 'utf8'));

fs.writeFileSync(
  './packages/cli/src/constants/version.js',
  `export const VERSION = '${packageJson.version}';\n`,
  'utf8'
);
