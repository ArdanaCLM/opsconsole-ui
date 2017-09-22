[//]: <> (\(c\) Copyright 2016-2017 Hewlett Packard Enterprise Development LP)
[//]: <> (\(c\) Copyright 2017 SUSE LLC)
# Ops Console
The UI project runs on nodejs on port 9000 by default, and will auto-reload on changes

Autoload does not work on Internet Explorer

## Quick start
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.bash_profile
nvm install 5.4.1
npm -g install gulp bower
npm install
bower install
gulp
```

## Getting started
**Note**: does not support windows. (nvm does not support windows see: [NVM#284](https://github.com/creationix/nvm/issues/284))

1. Install NVM in your home folder. This by default is installed in ~/.nvm. See: [github.com/creationix/nvm](https://github.com/creationix/nvm)
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.bash_profile
```
2. Install Node
```
nvm install 5.4.1
```
3. Install tools
  * Option 1: install gulp and bower 'globally' (when using nvm the -g flag will install these packages in the current node version's library directory)
```
npm -g install gulp bower
```
  * Option 2: install gulp and bower locally
```
npm install gulp bower
```
4. Install dependencies (this reads the package.json file and bower.json file to install dependencies)
**Note**: with local tools the path for bower will be `node_modules/.bin/bower`
```
npm install
bower install
```
5. Run gulp
(**Note**: with local tools the path for gulp will be `node_modules/.bin/gulp`)
  * Development server
```
gulp
```
  * Start production build
```
gulp dist
```
  * Run lint and unit tests
```
gulp gatecheck
```
  * Run protractor tests
```
gulp protractor
```
The --env option can be used to choose between testing a standard or legacy environment
```
gulp protractor --env stdcfg
```
The --no-coverage option can be used to ignore code coverage report creation
```
gulp protractor --no-coverage
```
6. Add local config (local configuration changes will be ignored by git)
  * Copy sample
```
cp app/local/config.json.sample app/local/config.json
```
  * Add some good additional parameters
```json
{
    "bll_url": "https://192.168.245.5:9095/api/v1/", //local opsconsole-server
    "debug_mode": "true",
    "dev_mode": true,
    "env": "stdcfg"
}
```

## Connect to backend that does not have CORS enabled.
When connecting to a backend that does not have CORS enabled the web browser will give permission errors. The gulp server can be configured to proxy requests to the backend to work around the same origin policy. This is only required for development, production servers will not have this issue.

app/local/config.json:
```json
{
    "bll_url": "https://10.241.122.5:9095/api/v1/", //remote opsconsole-server
    "proxy": true
}
```

## refreshing dependencies have changed
To pull down dependent packages run these commands

**Note**: with local tools the path for bower will be `node_modules/.bin/bower`
```
npm install
bower install
```



## Locales:
Use this to find missing tags:
```
diff -bB <(sed "s/:.*//" app/locales/en/common.json |sort) <(sed "s/:.*//" app/locales/ja/common.json|sort)
```
