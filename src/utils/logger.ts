import chalk from "chalk";
import ora from "ora";

export class Logger {
  static title(message: string) {
    console.log("");
    console.log(chalk.bold.cyan(message));
    console.log("");
  }

  static header(message: string) {
    console.log("");
    console.log(chalk.bold.blue(message));
    console.log("");
  }

  static success(message: string) {
    console.log(chalk.green("✔"), message);
  }

  static error(message: string) {
    console.log(chalk.red("✖"), message);
  }

  static info(message: string) {
    console.log(chalk.blue("ℹ️ "), message);
  }

  static file(filePath: string) {
    console.log(chalk.gray("📁"), chalk.cyan(filePath));
  }

  static spinner(message: string) {
    return ora(message).start();
  }

  static code(code: string) {
    console.log(chalk.gray(code));
  }
}
