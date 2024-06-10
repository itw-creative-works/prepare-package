const jetpack = require('fs-jetpack');
const fetch = require('wonderful-fetch');
const path = require('path');
const chalk = require('chalk');

// const argv = require('yargs').argv;

module.exports = async function (options) {
  // Set the options
  options = options || {};
  options.purge = typeof options.purge === 'undefined' ? true : options.purge;
  options.cwd = options.cwd || process.cwd();
  options.isPostInstall = typeof options.isPostInstall === 'undefined' ? false : options.isPostInstall;

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

  // Handle post install
  if (options.isPostInstall) {
    // Send analytics
    await sendAnalytics(thisPackageJSON, theirPackageJSON)
    .then(() => {
      console.log(chalk.green(`[prepare-package]: Sent analytics...`));
    })
    .catch(e => {
      console.log(chalk.red(`[prepare-package]: Failed to send analytics...`, e));
    });
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
  .then(result => {
    console.log(chalk.green(`[prepare-package]: Purged... ${theirPackageJSON.name}`));
  })
  .catch(e => {
    console.log(chalk.red(`[prepare-package]: Failed to purge... ${theirPackageJSON.name}`, e));
  })
}

// Send analytics
function sendAnalytics(thisPackageJSON, theirPackageJSON) {
  return new Promise(async function(resolve, reject) {
    const uuidv5 = require('uuid').v5;
    const os = require('os');
    const userInfo = os.userInfo();

    // Build url and body
    const analyticsId = 'G-9YP4NNBLY3';
    const analyticsSecret = 'w3Z2tfucR9KFPB8it5WkyQ';
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${analyticsId}&api_secret=${analyticsSecret}`;
    const mac = getDeviceUniqueId();
    const uuid = uuidv5(mac, '4caf995a-3d43-451b-b34d-e535d2663bc1');
    const simpleOS = getSimpleOS(os.platform());
    const body = {
      client_id: uuid,
      user_id: uuid,
      // timestamp_micros: new Date().getTime() * 1000,
      user_properties: {
        operating_system: simpleOS,
      },
      user_data: {
      },
      // consent: {},
      // non_personalized_ads: false,
      events: [{
        name: theirPackageJSON.name,
        params: {
          packageName: theirPackageJSON.name,
          packageVersion: theirPackageJSON.version,
          preparePackageVersion: thisPackageJSON.version,
          os: simpleOS,
          platform: os.platform(),
          arch: os.arch(),
          release: os.release(),
          hostname: os.hostname(),
          cpus: os.cpus().length,
          memory: os.totalmem(),
          uptime: os.uptime(),
          username: userInfo.username,
          homedir: userInfo.homedir,
          shell: userInfo.shell,
          uid: userInfo.uid,
          gid: userInfo.gid,
        },
      }],
    }

    // Get the user's location
    const geolocation = await fetch('https://ipapi.co/json/', {
      response: 'json',
      tries: 2,
      timeout: 30000,
    })
    .catch(e => {
      console.log(chalk.red(`[prepare-package]: Failed to get geolocation...`, e));
    });

    // Add the geolocation to the body
    if (geolocation) {
      body.user_data.city = geolocation.city || 'Unknown';
      body.user_data.region = geolocation.region || 'Unknown';
      body.user_data.country = geolocation.country || 'Unknown';

      body.user_properties.language = (geolocation.languages || 'Unknown').split(',')[0];
    }

    // Log the options
    // console.log(chalk.blue(`[prepare-package]: Sending analytics...`, mac, uuid), body, body.events[0].params);
    console.log(chalk.blue(`[prepare-package]: Sending analytics...`, mac, uuid));

    // Send event
    fetch(url, {
      method: 'post',
      response: 'text',
      tries: 2,
      timeout: 30000,
      body: body,
    })
    .then((r) => {
      resolve(r);
    })
    .catch((e) => {
      reject(e);
    });
  });
}

const getDeviceUniqueId = () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();

  // Find the first valid MAC address
  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
        return net.mac;
      }
    }
  }

  // Log
  console.warn('No valid MAC address found. Generating a random MAC address.');

  // Generate a random MAC address
  const hexDigits = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    let byte = '';
    for (let j = 0; j < 2; j++) {
      byte += hexDigits.charAt(Math.floor(Math.random() * 16));
    }
    mac += byte;
    if (i !== 5) mac += ':';
  }
  return mac;
};

const getSimpleOS = (platform) => {
  switch (platform) {
    case 'darwin':
      return 'mac';
    case 'win32':
      return 'windows';
    case 'linux':
      return 'linux';
    default:
      return platform;
  }
};

