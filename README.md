<p align="center">
  <a href="https://cdn.itwcreativeworks.com/assets/itw-creative-works/images/logo/itw-creative-works-brandmark-black-x.svg">
    <img src="https://cdn.itwcreativeworks.com/assets/itw-creative-works/images/logo/itw-creative-works-brandmark-black-x.svg" width="100px">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/package-json/v/itw-creative-works/prepare-package.svg">
  <br>
  <img src="https://img.shields.io/david/itw-creative-works/prepare-package.svg">
  <img src="https://img.shields.io/david/dev/itw-creative-works/prepare-package.svg">
  <img src="https://img.shields.io/bundlephobia/min/prepare-package.svg">
  <img src="https://img.shields.io/codeclimate/maintainability-percentage/itw-creative-works/prepare-package.svg">
  <img src="https://img.shields.io/npm/dm/prepare-package.svg">
  <img src="https://img.shields.io/node/v/prepare-package.svg">
  <img src="https://img.shields.io/website/https/itwcreativeworks.com.svg">
  <img src="https://img.shields.io/github/license/itw-creative-works/prepare-package.svg">
  <img src="https://img.shields.io/github/contributors/itw-creative-works/prepare-package.svg">
  <img src="https://img.shields.io/github/last-commit/itw-creative-works/prepare-package.svg">
  <br>
  <br>
  <a href="https://itwcreativeworks.com">Site</a> | <a href="https://www.npmjs.com/package/prepare-package">NPM Module</a> | <a href="https://github.com/itw-creative-works/prepare-package">GitHub Repo</a>
  <br>
  <br>
  <strong>Prepare Package</strong> is a drop-in replacement NPM module that prepares your package before distribution.
</p>

## Install Prepare Package
### Install via npm
Install with npm if you plan to use **Prepare Package** in a Node.js project.
```shell
npm install prepare-package --save-dev
```

## Features
* Copy files from `src` to `dist`
* Replace tags in your main file, `index.js`
  * `{version}` => `package.version`

## Example Setup
After installing via npm, simply put this in your `package.json`
```json
...
"main": "dist/index.js",
"scripts": {
  "prepare": "node -e 'require(`prepare-package`)'"
},
"preparePackage": {
  "input": "src",
  "output": "dist",
  "replace": {}
},
...
```
* `preparePackage` is not required but you can provide it to customize the process.
* `preparePackage.input`: The dir to copy **from**.
* `preparePackage.out`: The dir to copy **to**.
* `main`: The file to copy and use as your main file. Tags like `{version}` are replaced in this file.

## Final Words
If you are still having difficulty, we would love for you to post a question to [the Prepare Package issues page](https://github.com/itw-creative-works/prepare-package/issues). It is much easier to answer questions that include your code and relevant files! So if you can provide them, we'd be extremely grateful (and more likely to help you find the answer!)
