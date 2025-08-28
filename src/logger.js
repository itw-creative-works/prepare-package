const chalk = require('chalk');

// Setup logger
const logger = {};

// Loop through log, error, warn, and info and make methods that log to console with the name and time [xx:xx:xx] name: message
['log', 'error', 'warn', 'info'].forEach((method) => {
  logger[method] = function () {
    // Get time
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Determine color based on method
    let color;
    switch (method) {
      case 'warn':
        color = chalk.yellow;
        break;
      case 'error':
        color = chalk.red;
        break;
      default:
        color = (text) => text; // No color
    }

    // Convert arguments to array and prepend time and name
    const args = [`[${chalk.magenta(time)}] '${chalk.cyan('prepare-package')}':`, ...Array.from(arguments).map(arg => {
      return typeof arg === 'string'
        ? color(arg)
        : (
            arg instanceof Error
              ? color(arg.stack)
              : arg
          );
    })];

    // Log
    console[method].apply(console, args);
  };
});

module.exports = logger;