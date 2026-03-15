#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { default: chalk } = require('chalk');
const logger = require('./logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question, defaultValue) {
  const suffix = defaultValue ? ` (${chalk.cyan(defaultValue)})` : '';
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

function askChoice(question, choices, defaultIndex) {
  console.log(`\n${question}`);
  choices.forEach((choice, i) => {
    const marker = i === defaultIndex ? chalk.green('❯') : ' ';
    console.log(`  ${marker} ${i + 1}) ${choice}`);
  });

  return new Promise((resolve) => {
    rl.question(`Choice (${defaultIndex + 1}): `, (answer) => {
      const index = parseInt(answer, 10) - 1;
      resolve(choices[Number.isNaN(index) || index < 0 || index >= choices.length ? defaultIndex : index]);
    });
  });
}

function toTitleCase(name) {
  return name
    .replace(/[-_@/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

async function init() {
  const cwd = process.cwd();
  const pkgPath = path.resolve(cwd, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    logger.error('No package.json found in current directory. Run `npm init` first.');
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  console.log(chalk.bold(`\n  prepare-package init\n`));
  console.log(`  Setting up ${chalk.cyan(pkg.name || 'your package')}...\n`);

  // Ask type
  const type = await askChoice('Build type:', ['copy', 'bundle'], 0);

  // Ask input/output
  const input = await ask('Source directory', 'src');
  const output = await ask('Output directory', 'dist');

  // Build preparePackage config
  const config = {
    input,
    output,
    type,
  };

  // Bundle-specific config
  if (type === 'bundle') {
    const defaultGlobal = toTitleCase(pkg.name || 'MyLib');
    const defaultFileName = `${(pkg.name || 'my-lib').replace(/@.*\//, '')}.min.js`;

    const formatsRaw = await ask('Formats (comma-separated)', 'esm, cjs, iife');
    const formats = formatsRaw.split(',').map(f => f.trim()).filter(Boolean);

    config.build = { formats };

    if (formats.includes('iife')) {
      const globalName = await ask('IIFE global name', defaultGlobal);
      const fileName = await ask('IIFE filename', defaultFileName);

      config.build.iife = { globalName, fileName };
    }
  }

  // Update package.json
  pkg.preparePackage = config;
  pkg.main = pkg.main || `./${output}/index.js`;

  if (type === 'bundle') {
    pkg.module = pkg.module || `./${output}/index.mjs`;
    pkg.exports = pkg.exports || {
      '.': {
        import: `./${output}/index.mjs`,
        require: `./${output}/index.js`,
      },
    };
  }

  // Add scripts
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.prepare = `node -e "require('prepare-package')()"`;
  pkg.scripts['prepare:watch'] = `node -e "require('prepare-package/watch')()"`;

  // Write
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  console.log(`\n${chalk.green('Done!')} Updated package.json:\n`);
  console.log(chalk.gray(JSON.stringify({ preparePackage: config }, null, 2)));
  console.log(`\nRun ${chalk.cyan('npm run prepare')} to build.\n`);

  rl.close();
}

init().catch((err) => {
  logger.error(err.message);
  rl.close();
  process.exit(1);
});
