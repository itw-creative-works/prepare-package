module.exports = function (options) {
  const jetpack = require('fs-jetpack');
  const fetch = require('wonderful-fetch');
  const path = require('path');
  const chalk = require('chalk');
  const thisPackageJSON = require('../package.json');
  const theirPackageJSON = require(path.join(process.cwd(), 'package.json'));
  const isLivePreparation = theirPackageJSON.name !== 'prepare-package';
  // const argv = require('yargs').argv;
  
  options = options || {};
  options.purge = typeof options.purge === 'undefined' ? true : options.purge;

  // const options = {
  //   purge: argv['--purge'] || argv['-p'],
  // };

  // fix
  theirPackageJSON.main = theirPackageJSON.main || './dist/index.js';
  theirPackageJSON.preparePackage = theirPackageJSON.preparePackage || {};
  theirPackageJSON.preparePackage.input = path.resolve(theirPackageJSON.preparePackage.input || './src');
  theirPackageJSON.preparePackage.output = path.resolve(theirPackageJSON.preparePackage.output || './dist');
  theirPackageJSON.preparePackage.replace = theirPackageJSON.preparePackage.replace || {};
  
  console.log(chalk.blue(`[prepare-package]: Options... purge=${options.purge}`));
  console.log(chalk.blue(`[prepare-package]: input=${theirPackageJSON.preparePackage.input}`));
  console.log(chalk.blue(`[prepare-package]: output=${theirPackageJSON.preparePackage.output}`));
  console.log(chalk.blue(`[prepare-package]: main=${theirPackageJSON.main}`));
  
  jetpack.remove(
    theirPackageJSON.preparePackage.output,
  )
  
  jetpack.copy(
    theirPackageJSON.preparePackage.input,
    theirPackageJSON.preparePackage.output,
  )
  
  // Only do this part on the actual package that is using THIS package because we dont't want to replace THIS {version}
  if (isLivePreparation) {
    function _replaceMain() {
      let content = jetpack.read(theirPackageJSON.main)
        // .replace(/{version}/igm, package.version)
        .replace(/{version}/igm, theirPackageJSON.version)
      return content;
    }
    jetpack.write(
      theirPackageJSON.main,
      _replaceMain()
    )
  }
  
  if (options.purge === false) {
    return;
  } else {
    return fetch(`https://purge.jsdelivr.net/npm/${theirPackageJSON.name}@latest`, {
      response: 'json',
      tries: 3,
    })
    .then(result => {
      // console.log(chalk.green(`[prepare-package]: Purged... name=${theirPackageJSON.name}`), result);
      console.log(chalk.green(`[prepare-package]: Purged... ${theirPackageJSON.name}`));
    })
    .catch(e => {
      console.log(chalk.red(`[prepare-package]: Failed to purge... ${theirPackageJSON.name}`, e));
    })   
  }
  
    
}
