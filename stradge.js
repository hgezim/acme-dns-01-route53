"use strict";
const route53 = require('nice-route53');

module.exports.create = function(config) {
  const route53 = new NiceRoute53({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
  });

  return {
    init: function(opts) {
      return null;
    },
    zones: function(opts) {
      console.log("zones opts:", opts);
      return new Promise((accept, reject) => {
        route53.zones(function(err, zones) {
          if (err) {
            reject(err);
          }

          accept(zones.map(zone => zone.name));
          // zones is an array of zones
          console.log(zones);
        });
      });
    },
    set: function(opts) {
      console.log("set opts:", opts);
      throw new Error("set not implemented");
    },

    remove: function(opts) {
      console.log("remove opts:", opts);
      throw new Error("remove not implemented");
    },

    get: function(opts) {
      console.log("get opts:", opts);
      throw new Error("get not implemented");
    }
  };
};
