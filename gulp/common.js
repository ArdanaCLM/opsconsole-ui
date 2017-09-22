// (C) Copyright 2015-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC

var message = "© Copyright 2015-2016 Hewlett Packard Enterprise Development LP",
   jsCssMessage = "/*! " + message + " */\n";

var fs = require('fs');

var Proxy = require('./gcp.js');

var config;

try {
  var rawJson = fs.readFileSync('app/local/config.json', 'utf-8'),
      sanitizedJson = "",
      comment = false,
      string = false;

  //strip out comments in the json file.
  for(var ii=0;ii<rawJson.length;ii++) {
    if(!comment) {
      if(!string && rawJson[ii] === '/' && rawJson[ii+1] === '/') {
         comment = true;
      } else {
        if(rawJson[ii] === '"') {
          string = !string;
        }
        sanitizedJson = sanitizedJson + rawJson[ii];
      }
    } else if(comment && rawJson[ii] === '\n') {
      comment = false;
      sanitizedJson = sanitizedJson + rawJson[ii];
    }
  }
  config = JSON.parse(sanitizedJson);
} catch(e) {
  console.info("No local config file, skipping");
}

var proxyPath = "/api/v1";

module.exports = {
  copyrightMessage: {
    js: jsCssMessage,
    css: jsCssMessage,
    html: '<!-- ' + message + ' -->\n'
  },
  config: config,
  proxyPath: proxyPath + "/",
  middleware: function (connect, options) {
    if(config && config.proxy) {
      options.route = proxyPath;
      options.proxyRoot = config.bll_url || "/";
      var proxy = new Proxy(options);
      return [proxy];
    } else {
      return [];
    }
  },
  flatten: function(p, c) {
    return p ? c : p.concat(c);
  }
};
