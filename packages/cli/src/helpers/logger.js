import chalk from "chalk";

export const logger = {
  error(...args) {
    console.log(chalk.red(...args));
    process.exit(1)
  },
  info(...args) {
    console.log(chalk.cyan(...args));
  },
  success(...args) {
    console.log(chalk.green(...args));
  },
};