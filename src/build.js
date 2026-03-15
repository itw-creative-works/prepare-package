const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { default: chalk } = require('chalk');

/**
 * Build using esbuild based on preparePackage config
 *
 * @param {object} options
 * @param {string} options.cwd - Working directory
 * @param {object} options.packageJSON - Consumer's package.json
 * @param {object} options.config - preparePackage config
 * @returns {Promise<void>}
 */
async function build(options) {
  const esbuild = require('esbuild');

  const { cwd, packageJSON, config } = options;
  const buildConfig = config.build || {};
  const version = packageJSON.version;
  const inputPath = path.resolve(cwd, config.input || './src');
  const outputPath = path.resolve(cwd, config.output || './dist');

  // Resolve entry point
  const entry = path.resolve(cwd, buildConfig.entry || path.join(config.input || './src', 'index.js'));

  // Default formats
  const formats = buildConfig.formats || ['esm', 'cjs'];

  // Version replacement plugin
  const versionPlugin = {
    name: 'version-replace',
    setup(build) {
      build.onLoad({ filter: /\.js$/ }, async (args) => {
        let contents = fs.readFileSync(args.path, 'utf8');
        contents = contents.replace(/\{version\}/g, version);
        return { contents, loader: 'js' };
      });
    },
  };

  // Shared options
  const shared = {
    entryPoints: [entry],
    bundle: true,
    sourcemap: buildConfig.sourcemap || false,
    plugins: [versionPlugin],
    external: buildConfig.external || [],
  };

  const target = buildConfig.target || 'es2020';
  const platform = buildConfig.platform || 'neutral';
  const builds = [];

  // ESM
  if (formats.includes('esm')) {
    builds.push({
      ...shared,
      outfile: path.join(outputPath, 'index.mjs'),
      format: 'esm',
      platform,
      minify: false,
      target,
    });
  }

  // CJS
  if (formats.includes('cjs')) {
    builds.push({
      ...shared,
      outfile: path.join(outputPath, 'index.js'),
      format: 'cjs',
      platform,
      minify: false,
      target,
    });
  }

  // IIFE (UMD/CDN)
  if (formats.includes('iife')) {
    const iife = buildConfig.iife || {};
    const globalName = iife.globalName;

    if (!globalName) {
      throw new Error('preparePackage.build.iife.globalName is required when using "iife" format');
    }

    const fileName = iife.fileName || `${packageJSON.name}.min.js`;

    builds.push({
      ...shared,
      outfile: path.join(outputPath, fileName),
      format: 'iife',
      globalName,
      minify: true,
      target: iife.target || 'es2015',
      // Unwrap default export so window[globalName] is the class directly
      footer: { js: `${globalName}=${globalName}.default||${globalName}.${globalName}||${globalName};` },
    });
  }

  // Build all formats
  await Promise.all(builds.map(config => esbuild.build(config)));

  const formatNames = formats.map(f => f.toUpperCase()).join(', ');
  logger.log(chalk.green(`Built ${packageJSON.name} v${version} (${formatNames})`));
}

/**
 * Create esbuild watch contexts for watch mode
 *
 * @param {object} options - Same as build()
 * @returns {Promise<object[]>} Array of esbuild contexts
 */
async function createWatchContexts(options) {
  const esbuild = require('esbuild');

  const { cwd, packageJSON, config } = options;
  const buildConfig = config.build || {};
  const version = packageJSON.version;
  const inputPath = path.resolve(cwd, config.input || './src');
  const outputPath = path.resolve(cwd, config.output || './dist');

  const entry = path.resolve(cwd, buildConfig.entry || path.join(config.input || './src', 'index.js'));
  const formats = buildConfig.formats || ['esm', 'cjs'];

  const versionPlugin = {
    name: 'version-replace',
    setup(build) {
      build.onLoad({ filter: /\.js$/ }, async (args) => {
        let contents = fs.readFileSync(args.path, 'utf8');
        contents = contents.replace(/\{version\}/g, version);
        return { contents, loader: 'js' };
      });
    },
  };

  const shared = {
    entryPoints: [entry],
    bundle: true,
    sourcemap: buildConfig.sourcemap || false,
    plugins: [versionPlugin],
    external: buildConfig.external || [],
  };

  const target = buildConfig.target || 'es2020';
  const platform = buildConfig.platform || 'neutral';
  const builds = [];

  if (formats.includes('esm')) {
    builds.push({
      ...shared,
      outfile: path.join(outputPath, 'index.mjs'),
      format: 'esm',
      platform,
      minify: false,
      target,
    });
  }

  if (formats.includes('cjs')) {
    builds.push({
      ...shared,
      outfile: path.join(outputPath, 'index.js'),
      format: 'cjs',
      platform,
      minify: false,
      target,
    });
  }

  if (formats.includes('iife')) {
    const iife = buildConfig.iife || {};
    const globalName = iife.globalName;

    if (!globalName) {
      throw new Error('preparePackage.build.iife.globalName is required when using "iife" format');
    }

    const fileName = iife.fileName || `${packageJSON.name}.min.js`;

    builds.push({
      ...shared,
      outfile: path.join(outputPath, fileName),
      format: 'iife',
      globalName,
      minify: true,
      target: iife.target || 'es2015',
      footer: { js: `${globalName}=${globalName}.default||${globalName}.${globalName}||${globalName};` },
    });
  }

  const contexts = await Promise.all(
    builds.map(config => esbuild.context(config)),
  );

  await Promise.all(contexts.map(ctx => ctx.watch()));

  const formatNames = formats.map(f => f.toUpperCase()).join(', ');
  logger.log(chalk.green(`Watching ${packageJSON.name} v${version} (${formatNames})...`));

  return contexts;
}

module.exports = { build, createWatchContexts };
