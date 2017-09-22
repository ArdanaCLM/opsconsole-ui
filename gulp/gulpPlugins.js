// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
module.exports = require("gulp-load-plugins")({
    lazy:false,
    pattern: [
    	'gulp-*',
    	'main-bower-files',
    	'event-stream',
    	'del',
    	'run-sequence',
    	'merge-stream'
    ]
});
