import chalk from "chalk";
import ora, { Ora } from "ora";

export class Logger {
  static success(message: string) {
    console.log(chalk.green("✅ " + message));
  }

  static error(message: string) {
    console.log(chalk.red("❌ " + message));
  }

  static info(message: string) {
    console.log(chalk.blue("ℹ️  " + message));
  }

  static warning(message: string) {
    console.log(chalk.yellow("⚠️  " + message));
  }

  static title(message: string) {
    console.log(chalk.bold.cyan("\n" + message + "\n"));
  }

  static file(path: string) {
    console.log(chalk.gray("📁 " + path));
  }

  static spinner(message: string): Ora {
    return ora(message).start();
  }

  static code(code: string) {
    console.log(chalk.gray(code));
  }
}
