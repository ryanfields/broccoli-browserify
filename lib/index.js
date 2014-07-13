var fs = require('fs');
var path = require('path');
var RSVP = require('rsvp');
var mkdirp = require('mkdirp');
var browserify = require('browserify')
var Writer = require('broccoli-writer');

function BrowserifyWriter(inputTree, options) {
  if (!(this instanceof BrowserifyWriter)) {
    return new BrowserifyWriter(inputTree, options);
  }

  options = options || {};

  this.entries = options.entries || [];
  this.outputFile = options.outputFile || '/browserify.js';
  this.browserifyOptions = options.browserify || {};
  this.bundleOptions = options.bundle || {};
  this.requireOptions = options.require || [];
  this.external = options.external || [];
  this.transformOptions = options.transform || [];
  this.exclude = options.exclude || [];
  this.inputTree = inputTree;
}

BrowserifyWriter.prototype = Object.create(Writer.prototype);
BrowserifyWriter.prototype.constructor = BrowserifyWriter;

BrowserifyWriter.prototype.write = function (readTree, destDir) {
  var entries = this.entries;
  var outputFile = this.outputFile;
  var browserifyOptions = this.browserifyOptions;
  var bundleOptions = this.bundleOptions;
  var requireOptions = this.requireOptions;
  var external = this.external;
  var transformOptions = this.transformOptions;
  var exclude = this.exclude;

  return readTree(this.inputTree).then(function (srcDir) {
    mkdirp.sync(path.join(destDir, path.dirname(outputFile)));

    browserifyOptions.basedir = srcDir;
    var b = browserify(browserifyOptions);

    var i;
    for (i = 0; i < entries.length; i++) {
      b.add(entries[i]);
    }

    for(i = 0; i < requireOptions.length; i++){
      b.require.apply(b, requireOptions[i]);
    }

    b.external(external);

    for (i = 0; i < exclude.length; i++){
      b.exclude(exclude[i]);
    }

    for(i = 0; i < transformOptions.length; i++){
      b.transform.apply(b, transformOptions[i]);
    }

    return new RSVP.Promise(function (resolve, reject) {
      b.bundle(bundleOptions, function (err, data) {
        if (err) {
          reject(err);
        } else {
          fs.writeFileSync(path.join(destDir, outputFile), data);
          resolve(destDir);
        }
      });
    });
  });
};

module.exports = BrowserifyWriter;
