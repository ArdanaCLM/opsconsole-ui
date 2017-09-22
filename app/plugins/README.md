## Plugins

Plugins can be placed in this directory to be included in the dashboard.

An example plugin would have the folowing directory structure:
```
plugins
└──  myPlugin
     ├── locales
     │    ├── en
     │    │   └── myPlugin.json
     │    └── ja
     │        └── myPlugin.json
     ├── scripts
     │   └── myPluginCode.js
     ├── styles
     │   ├── _variables.scss
     │   └── myPluginStyles.css
     └── templates
         └── myPluginTemplate.html
```
The names of all files do not matter except for the locale files which must be named the same as the plugin name (eg "myPlugin").