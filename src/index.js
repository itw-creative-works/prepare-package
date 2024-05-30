const jetpack = require('fs-jetpack');
const fetch = require('wonderful-fetch');
const path = require('path');
const chalk = require('chalk');
// const argv = require('yargs').argv;

module.exports = function (options) {
  // Set the options
  options = options || {};
  options.purge = typeof options.purge === 'undefined' ? true : options.purge;
  options.cwd = options.cwd || process.cwd();

  const thisPackageJSON = require('../package.json');
  const theirPackageJSON = require(path.join(options.cwd, 'package.json'));
  const isLivePreparation = theirPackageJSON.name !== 'prepare-package';

  // const options = {
  //   purge: argv['--purge'] || argv['-p'],
  // };

  // Fix their package.json
  theirPackageJSON.main = theirPackageJSON.main || './dist/index.js';
  theirPackageJSON.preparePackage = theirPackageJSON.preparePackage || {};
  theirPackageJSON.preparePackage.input = theirPackageJSON.preparePackage.input || './src';
  theirPackageJSON.preparePackage.output = theirPackageJSON.preparePackage.output || './dist';
  theirPackageJSON.preparePackage.replace = theirPackageJSON.preparePackage.replace || {};

  // Add script
  theirPackageJSON.scripts = theirPackageJSON.scripts || {};
  theirPackageJSON.scripts.prepare = theirPackageJSON.scripts.prepare
    || 'node -e \'require(`prepare-package`)()\'';
  theirPackageJSON.scripts['prepare:watch'] = theirPackageJSON.scripts['prepare:watch']
    || `nodemon -w ./src -e '*' --exec 'npm run prepare'`

  // Log the options
  console.log(chalk.blue(`[prepare-package]: Options... purge=${options.purge}`));
  console.log(chalk.blue(`[prepare-package]: input=${theirPackageJSON.preparePackage.input}`));
  console.log(chalk.blue(`[prepare-package]: output=${theirPackageJSON.preparePackage.output}`));
  console.log(chalk.blue(`[prepare-package]: main=${theirPackageJSON.main}`));

  // Remove the output folder
  jetpack.remove(
    path.resolve(options.cwd, theirPackageJSON.preparePackage.output),
  )

  // Copy the input folder to the output folder
  jetpack.copy(
    path.resolve(options.cwd, theirPackageJSON.preparePackage.input),
    path.resolve(options.cwd, theirPackageJSON.preparePackage.output),
  )

  // Only do this part on the actual package that is using THIS package because we dont't want to replace THIS {version}
  if (isLivePreparation) {
    const mainPath = path.resolve(options.cwd, theirPackageJSON.main);

    // Replace the main file
    jetpack.write(
      mainPath,
      jetpack.read(mainPath)
        .replace(/{version}/igm, theirPackageJSON.version),
    );

    // Replace the package.json
    jetpack.write(
      path.resolve(options.cwd, 'package.json'),
      JSON.stringify(theirPackageJSON, null, 2)
    );
  }

  if (options.purge === false) {
    return;
  } else {
    return fetch(`https://purge.jsdelivr.net/npm/${theirPackageJSON.name}@latest`, {
      response: 'json',
      tries: 3,
    })
    .then(result => {
      console.log(chalk.green(`[prepare-package]: Purged... ${theirPackageJSON.name}`));
    })
    .catch(e => {
      console.log(chalk.red(`[prepare-package]: Failed to purge... ${theirPackageJSON.name}`, e));
    })
  }
}


