const chalk = require('chalk');

export const log = (...args) => console.log(chalk.white(...args));
export const error = (...args) => console.error(chalk.red(...args));
export const warn = (...args) => console.warn(chalk.yellow(...args));
export const info = (...args) => console.info(chalk.cyan(...args));
export const success = (...args) => console.log(chalk.green(...args));

export function saneEnvironmentOrExit(...requiredVars) {
    const { env } = process;
    const missingEnvVariables = requiredVars.filter((key) => !env[key] && key);
    if (missingEnvVariables.length > 0) {
        error(
            `❌ process.env not sane!\n\nThe following variables are missing:\n${missingEnvVariables.join(
                '\n'
            )}`
        );
        process.exit(1);
    }
}
