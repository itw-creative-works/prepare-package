<p align="center">
  <a href="https://cdn.itwcreativeworks.com/assets/itw-creative-works/images/logo/itw-creative-works-brandmark-black-x.svg">
    <img src="https://cdn.itwcreativeworks.com/assets/itw-creative-works/images/logo/itw-creative-works-brandmark-black-x.svg" width="100px">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/package-json/v/itw-creative-works/promo-server.svg">
  <br>
  <img src="https://img.shields.io/david/itw-creative-works/promo-server.svg">
  <img src="https://img.shields.io/david/dev/itw-creative-works/promo-server.svg">
  <img src="https://img.shields.io/bundlephobia/min/promo-server.svg">
  <img src="https://img.shields.io/codeclimate/maintainability-percentage/itw-creative-works/promo-server.svg">
  <img src="https://img.shields.io/npm/dm/promo-server.svg">
  <img src="https://img.shields.io/node/v/promo-server.svg">
  <img src="https://img.shields.io/website/https/itwcreativeworks.com.svg">
  <img src="https://img.shields.io/github/license/itw-creative-works/promo-server.svg">
  <img src="https://img.shields.io/github/contributors/itw-creative-works/promo-server.svg">
  <img src="https://img.shields.io/github/last-commit/itw-creative-works/promo-server.svg">
  <br>
  <br>
  <a href="https://itwcreativeworks.com">Site</a> | <a href="https://www.npmjs.com/package/promo-server">NPM Module</a> | <a href="https://github.com/itw-creative-works/promo-server">GitHub Repo</a>
  <br>
  <br>
  <strong>Promo Server</strong> is an NPM module for backend and frontend developers that exposes promotion utilities for ITW Creative Works.
</p>

## Install Promo Server
### Install via npm
Install with npm if you plan to use **Promo Server** in a Node.js project or in the browser.
```shell
npm install promo-server
```
If you plan to use `promo-server` in a browser environment, you will probably need to use [Webpack](https://www.npmjs.com/package/webpack), [Browserify](https://www.npmjs.com/package/browserify), or a similar service to compile it.

```js
const promoserver = new (require('promo-server'))();
```

### Install via CDN
Install with CDN if you plan to use **Promo Server** only in a browser environment.
```html
<script src="https://cdn.jsdelivr.net/npm/promo-server@latest/dist/index.min.js"></script>
<script type="text/javascript">
  var promoserver = new PromoServer(); // The script above exposes the global variable 'PromoServer'
</script>
```

## Features
* Useful **promo management** for ITW Creative Works

## Example Setup
After installing via npm, simply `require` the library and begin enjoying the promo handler.
```js
const promoserver = new (require('promo-server'))({
  app: 'example', // <any string>
  platform: 'web', // web | electron | extension
  log: true, // true | false
  firebase: firebase // reference to firebase (one will be implied if not provided)
});
```
## Usage
### promoserver.handle(fn)

Set up a handler for new promo updates that will call `fn` when there is a promo update
```js
promoserver.handle(function (payload) {
  console.log('Payload', payload);
});
```

### promoserver.setUser(user)

Set the current user so things like `user.plan.id` can be considered for the handler
```js
promoserver.setUser({});
```

## Final Words
If you are still having difficulty, we would love for you to post a question to [the Promo Server issues page](https://github.com/itw-creative-works/promo-server/issues). It is much easier to answer questions that include your code and relevant files! So if you can provide them, we'd be extremely grateful (and more likely to help you find the answer!)

Ask us to have your project listed! :)
