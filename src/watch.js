const chokidar = require('chokidar');
const jetpack = require('fs-jetpack');
const path = require('path');
const prepare = require('./index');
const logger = require('./logger');

module.exports = async function watch() {
  const cwd = process.cwd();
  
  // Get package.json info
  const packageJSONPath = path.resolve(cwd, 'package.json');
  const packageJSONExists = jetpack.exists(packageJSONPath);
  const packageJSON = packageJSONExists ? require(packageJSONPath) : {};
  
  // Set up paths
  packageJSON.preparePackage = packageJSON.preparePackage || {};
  const inputPath = path.resolve(cwd, packageJSON.preparePackage.input || './src');
  const outputPath = path.resolve(cwd, packageJSON.preparePackage.output || './dist');
  const mainPath = path.resolve(cwd, packageJSON.main || './dist/index.js');
  const isLivePreparation = packageJSON.name !== 'prepare-package';
  
  // Run initial prepare (full copy)
  logger.log('Running initial prepare...');
  await prepare({ purge: false });
  logger.log('Initial prepare complete!');
  
  // Set up watcher
  logger.log('Watching for changes...');
  
  const watcher = chokidar.watch(inputPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    }
  });
  
  // Helper function to process a single file
  const processSingleFile = (filePath, eventType) => {
    const relativePath = path.relative(inputPath, filePath);
    const destPath = path.join(outputPath, relativePath);
    
    try {
      if (eventType === 'unlink' || eventType === 'unlinkDir') {
        // Remove the file/directory from output
        if (jetpack.exists(destPath)) {
          jetpack.remove(destPath);
          logger.log(`Removed: ${relativePath}`);
        }
      } else if (eventType === 'addDir') {
        // Create directory in output
        jetpack.dir(destPath);
        logger.log(`Created dir: ${relativePath}`);
      } else if (eventType === 'add' || eventType === 'change') {
        // Copy the file to output
        jetpack.copy(filePath, destPath, { overwrite: true });
        
        // Apply version replacement if it's the main file
        if (isLivePreparation && destPath === mainPath) {
          jetpack.write(
            destPath,
            jetpack.read(destPath).replace(/{version}/igm, packageJSON.version)
          );
        }
        
        logger.log(`Updated: ${relativePath}`);
      }
    } catch (error) {
      logger.error(`Error processing ${relativePath}: ${error.message}`);
    }
  };
  
  // Set up event handlers
  watcher
    .on('add', path => processSingleFile(path, 'add'))
    .on('change', path => processSingleFile(path, 'change'))
    .on('addDir', path => processSingleFile(path, 'addDir'))
    .on('unlink', path => processSingleFile(path, 'unlink'))
    .on('unlinkDir', path => processSingleFile(path, 'unlinkDir'))
    .on('error', error => logger.error(`Watcher error: ${error}`))
    .on('ready', () => logger.log('Ready for changes!'));
  
  // Handle process termination
  process.on('SIGINT', () => {
    logger.log('Stopping watcher...');
    watcher.close();
    process.exit(0);
  });
}