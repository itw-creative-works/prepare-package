const jetpack = require('fs-jetpack');
const fetch = require('wonderful-fetch');
const path = require('path');
const chalk = require('chalk');
const logger = require('./logger');

// const argv = require('yargs').argv;

// Helper function to check for local dependencies
function checkForLocalDependencies(packageJSON) {
  const localDeps = [];
  const depTypes = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ];

  depTypes.forEach(type => {
    if (!packageJSON[type]) {
      return;
    }

    Object.entries(packageJSON[type]).forEach(([name, version]) => {
      // Check for file: protocol or relative/absolute paths
      if (version.startsWith('file:')
        || version.startsWith('../')
        || version.startsWith('./')
        || version.startsWith('/')
        || version.startsWith('~')) {
        localDeps.push({
          type,
          name,
          value: version
        });
      }
    });
  });

  return localDeps;
}

module.exports = async function (options) {
  // Set the options
  options = options || {};
  options.purge = typeof options.purge === 'undefined' ? true : options.purge;
  options.cwd = options.cwd || process.cwd();
  options.isPostInstall = typeof options.isPostInstall === 'undefined' ? false : options.isPostInstall;
  options.singleFile = options.singleFile || null; // For watch mode - single file to process

  // Detect if running via npm publish
  // When npm publish runs, it sets npm_command to 'publish' even though lifecycle_event is 'prepare'
  const isPublishing = process.env.npm_command === 'publish'
    || process.env.npm_lifecycle_event === 'prepublishOnly'
    || process.env.npm_lifecycle_event === 'prepublish';
  const isManualPrepare = process.env.npm_lifecycle_event === 'prepare' && !isPublishing;

  // Set the paths
  const theirPackageJSONPath = path.resolve(options.cwd, 'package.json');
  const theirPackageJSONExists = jetpack.exists(theirPackageJSONPath);

  // Get the package.json files
  const thisPackageJSON = require('../package.json');
  const theirPackageJSON = theirPackageJSONExists ? require(theirPackageJSONPath) : {};
  const isLivePreparation = theirPackageJSON.name !== 'prepare-package';


  // Check for local dependencies when publishing
  if (isPublishing) {
    const hasLocalDeps = checkForLocalDependencies(theirPackageJSON);
    if (hasLocalDeps.length > 0) {
      logger.error('Cannot publish with local dependencies!');
      logger.error('The following dependencies use local file references:');
      hasLocalDeps.forEach(dep => {
        logger.error(`  - ${dep.type}: ${dep.name} -> ${dep.value}`);
      });
      throw new Error('Publishing blocked: Remove local file dependencies before publishing to npm');
    }

    // Clean up files that should never be published (search recursively, exclude node_modules)
    const filesToRemove = [
      'firebase-debug.log',
      '.DS_Store',
      'Thumbs.db',
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
    ];

    filesToRemove.forEach(fileName => {
      const foundFiles = jetpack.find(options.cwd, {
        matching: [`**/${fileName}`, `!node_modules/**`],
      });

      foundFiles.forEach(filePath => {
        jetpack.remove(filePath);
        logger.log(chalk.yellow(`Removed ${path.relative(options.cwd, filePath)}`));
      });
    });
  }

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
  // theirPackageJSON.scripts.prepare = theirPackageJSON.scripts.prepare
  //   || 'node -e \'require(`prepare-package`)()\'';
  // theirPackageJSON.scripts['prepare:watch'] = theirPackageJSON.scripts['prepare:watch']
  //   || `nodemon -w ./src -e '*' --exec 'npm run prepare'`
  theirPackageJSON.scripts.prepare = `node -e \"require('prepare-package')()\"`;
  theirPackageJSON.scripts['prepare:watch'] = `node -e \"require('prepare-package/watch')()\"`

  // Log the options
  // console.log(chalk.blue(`[prepare-package]: Options purge=${options.purge}`));
  // console.log(chalk.blue(`[prepare-package]: input=${theirPackageJSON.preparePackage.input}`));
  // console.log(chalk.blue(`[prepare-package]: output=${theirPackageJSON.preparePackage.output}`));
  // console.log(chalk.blue(`[prepare-package]: main=${theirPackageJSON.main}`));
  if (!options.singleFile) {
    logger.log(`Starting...${isPublishing ? ' (via npm publish)' : ''}`);
    logger.log({
      purge: options.purge,
      input: theirPackageJSON.preparePackage.input,
      output: theirPackageJSON.preparePackage.output,
      main: theirPackageJSON.main,

      // lifecycle: process.env.npm_lifecycle_event,
      // command: process.env.npm_command,
      isPublishing: isPublishing,
    });
  }

  // Set the paths relative to the cwd
  const mainPath = path.resolve(options.cwd, theirPackageJSON.main);
  const outputPath = path.resolve(options.cwd, theirPackageJSON.preparePackage.output);
  const inputPath = path.resolve(options.cwd, theirPackageJSON.preparePackage.input);

  // Check if paths exist
  const mainPathExists = jetpack.exists(mainPath);
  const outputPathExists = jetpack.exists(outputPath);
  const inputPathExists = jetpack.exists(inputPath);

  // Handle single file mode (for watch)
  if (options.singleFile) {
    const relativePath = path.relative(inputPath, options.singleFile);
    const destPath = path.join(outputPath, relativePath);

    // Copy single file
    if (jetpack.exists(options.singleFile)) {
      jetpack.copy(options.singleFile, destPath, { overwrite: true });
      logger.log(`Updated: ${relativePath}`);
    }
  } else {
    // Normal mode - full copy
    // Remove the output folder if it exists (input must exist too)
    if (outputPathExists && inputPathExists) {
      jetpack.remove(outputPath);
    }

    // Copy the input folder to the output folder if it exists
    if (inputPathExists) {
      jetpack.copy(inputPath, outputPath);
    }
  }

  // Only do this part on the actual package that is using THIS package because we dont't want to replace THIS {version}
  if (isLivePreparation) {
    // In single file mode, only process if it's the main file
    if (options.singleFile) {
      const destPath = path.join(outputPath, path.relative(inputPath, options.singleFile));
      if (destPath === mainPath && jetpack.exists(destPath)) {
        jetpack.write(
          destPath,
          jetpack.read(destPath).replace(/{version}/igm, theirPackageJSON.version)
        );
      }
    } else {
      // Normal mode - process main file and package.json
      // Replace the main file
      if (mainPathExists) {
        jetpack.write(
          mainPath,
          jetpack.read(mainPath)
            .replace(/{version}/igm, theirPackageJSON.version),
        );
      }

      // Replace the package.json
      if (theirPackageJSONExists) {
        jetpack.write(
          theirPackageJSONPath,
          `${JSON.stringify(theirPackageJSON, null, 2)}\n`
        );
      }
    }
  }

  // Handle post install
  if (options.isPostInstall) {
    // Send analytics
    // ... moveed to another package
  }

  // If purge is disabled, then return
  if (options.purge === false) {
    return;
  }

  // Purge the CDN
  return fetch(`https://purge.jsdelivr.net/npm/${theirPackageJSON.name}@latest`, {
    response: 'json',
    tries: 3,
  })
  .then((r) => {
    // console.log(chalk.green(`[prepare-package]: Purged ${theirPackageJSON.name}`));
    logger.log(chalk.green(`Purged ${theirPackageJSON.name}: status=${r.status}, id=${r.id}, timestamp=${r.timestamp}`));
  })
  .catch((e) => {
    // console.log(chalk.red(`[prepare-package]: Failed to purge ${theirPackageJSON.name}`, e));
    logger.error(`Failed to purge ${theirPackageJSON.name}!`, e.stack);
  })
}

