const chalk = require('chalk');

const log = (...args) => console.log(...args);
const error = (...args) => console.error(chalk.red(...args));
const warn = (...args) => console.warn(chalk.yellow(...args));
const info = (...args) => console.info(chalk.cyan(...args));
const success = (...args) => console.log(chalk.green(...args));

module.exports = {
    log,
    error,
    warn,
    info,
    success,
    saneEnvironmentOrExit: (...requiredVars) => {
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
};

