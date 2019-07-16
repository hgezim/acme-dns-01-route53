"use strict";
const AWS = require("aws-sdk");

const getZones = client => {
  return new Promise((accept, reject) => {
    // TODO limit this search to only one zone to restrict potential for damage
    client.listHostedZonesByName((err, data) => {
      if (err) {
        reject(err);
      }

      accept(data.HostedZones.map(zone => {
        // drop '.' at the end of each zone
        zone.Name = zone.Name.substr(0, zone.Name.length-1);
        return zone;
      })); 
    });
  });
};

module.exports.create = function(config) {
  const client = new AWS.Route53({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
  });

  return {
    init: function(opts) {
      return null;
    },
    zones: function(opts) {
      // console.log("zones opts:", opts);

      return new Promise((accept, reject) => {
        // TODO limit this search to only one zone to restrict potential for damage
        client.listHostedZonesByName((err, data) => {
          if (err) {
            reject(err);
          }

          let zones = data.HostedZones.map(zone => zone.Name.substr(0, zone.Name.length-1)); // drop '.' at the end of each zone
    
          accept(zones);
        });
      });
    },
    set: function(data) {
      let ch = data.challenge;
      let txt = ch.dnsAuthorization;

      let zones = getZones(client).then(zoneData => {
        let zone = zoneData.filter(zone => zone.Name === ch.dnsZone)[0];

        if (! zone) {
          console.error("Zone could not be found");
          return null;
        }

        console.log("zone data 42:", zone);
        // console.log("L44 stuff zoneData:", zoneData);
        console.log("L44 stuff ch:", ch);
        client.changeResourceRecordSets({
          HostedZoneId: zone.Id,
          ChangeBatch: {
            Changes: [{
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: `${ch.dnsPrefix}.${ch.dnsZone}`,
                Type: 'TXT',
                TTL: 300,
                ResourceRecords: [{Value: `"${txt}"`}]
              }
            }],
            Comment: 'Updated txt record for Gezim' // TODO: fix this to make sense
          },
        }, (err, data) => {
          if (err) {
            console.log("Error upserting txt record:", err);
          }

          return true;
        });
      }).catch(e => {
        console.log('Encountered an error setting the record:', e);
      });

      return null;
    },

    remove: function(opts) {
      // console.log("remove opts:", opts);
      throw new Error("remove not implemented");
    },

    get: function(opts) {
    //   console.log("get opts:", opts);
      throw new Error("get not implemented");
    }
  };
};
