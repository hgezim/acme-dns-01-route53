"use strict";
const route53 = require('nice-route53');

module.exports.create = function(config) {

  


  return {
    init: function(opts) {
      return null;
    },
    zones: function(opts) {
      console.log('zones opts:', opts);
      throw new Error('set not implemented');
    },
    set: function(opts) {
      console.log('set opts:', opts);
      throw new Error('set not implemented');
    },

    remove: function(opts) {
      console.log('remove opts:', opts);
      throw new Error('remove not implemented');
    },

    get: function(opts) {
      console.log('get opts:', opts);
      throw new Error('get not implemented');
    }
  };
};
