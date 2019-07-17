import * as AWS from "aws-sdk";

const getZones = async (client: AWS.Route53) => {
  try {
    let data = await client.listHostedZonesByName().promise();
    let zoneData = data.HostedZones.map(zone => {
      // drop '.' at the end of each zone
      zone.Name = zone.Name.substr(0, zone.Name.length - 1);
      return zone;
    });

    return zoneData;
  } catch (e) {
    throw e;
  }
};

export const create = function(config) {
  const client = new AWS.Route53({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
  });

  return {
    init: function(opts) {
      return null;
    },
    zones: function(opts) {
      return getZones(client)
        .then(zones => {
          return zones.map(zone => zone.Name);
        })
        .catch(e => {
          console.error("Error listing zones:", e);
          return null;
        });
    },
    set: function(data) {
      let ch = data.challenge;
      let txt = ch.dnsAuthorization;

      return getZones(client)
        .then(zoneData => {
          let zone = zoneData.filter(zone => zone.Name === ch.dnsZone)[0];

          if (!zone) {
            console.error("Zone could not be found");
            return null;
          }

          return client.changeResourceRecordSets(
            {
              HostedZoneId: zone.Id,
              ChangeBatch: {
                Changes: [
                  {
                    Action: "UPSERT",
                    ResourceRecordSet: {
                      Name: `${ch.dnsPrefix}.${ch.dnsZone}`,
                      Type: "TXT",
                      TTL: 300,
                      ResourceRecords: [{ Value: `"${txt}"` }]
                    }
                  }
                ],
                Comment: "Updated txt record for Gezim" // TODO: fix this to make sense
              }
            },
            (err, data) => {
              if (err) {
                console.log("Error upserting txt record:", err);
                return null;
              }

              return true;
            }
          );
        })
        .catch(e => {
          console.log("Encountered an error setting the record:", e);
          return null;
        });
    },

    remove: function(data) {
      let ch = data.challenge;
      let txt = ch.dnsAuthorization;

      let zones = getZones(client)
        .then(zoneData => {
          let zone = zoneData.filter(zone => zone.Name === ch.dnsZone)[0];

          if (!zone) {
            console.error("Zone could not be found");
            return null;
          }

          client.changeResourceRecordSets(
            {
              HostedZoneId: zone.Id,
              ChangeBatch: {
                Changes: [
                  {
                    Action: "DELETE",
                    ResourceRecordSet: {
                      Name: `${ch.dnsPrefix}.${ch.dnsZone}`,
                      Type: "TXT",
                      TTL: 300
                    }
                  }
                ],
                Comment: "Delete txt record for Gezim" // TODO: fix this to make sense
              }
            },
            (err, data) => {
              if (err) {
                console.log("Error removing txt record:", err);
              }

              return true;
            }
          );
        })
        .catch(e => {
          console.log("Encountered an error deleting the record:", e);
        });

      return null;
    },

    get: function(data) {
      let ch = data.challenge;
      let txt = ch.dnsAuthorization;

      return getZones(client)
        .then(zoneData => {
          let zone = zoneData.filter(zone => zone.Name === ch.dnsZone)[0];

          if (!zone) {
            console.error("Zone could not be found");
            Promise.reject(null);
          }

          return new Promise((accept, reject) => {
            client.listResourceRecordSets(
              {
                HostedZoneId: zone.Id,
                StartRecordType: "TXT",
                StartRecordName: `${ch.dnsPrefix}`
              },
              (err, data) => {
                if (err) {
                  console.log("Error getting record set list:", err);
                  reject(null);
                }

                let match = data.ResourceRecordSets.filter(
                  rrs => rrs.Type === "TXT"
                )
                  .map(
                    rrs =>
                      rrs.ResourceRecords[0].Value.substring(
                        1,
                        rrs.ResourceRecords[0].Value.length - 1
                      ) // remove quotes sorrounding the strings
                  )
                  .filter(txtRecord => txtRecord == ch.dnsAuthorization)
                  .map(txtRec => {
                    return { dnsAuthorization: txtRec };
                  })[0];

                console.log("returning match:", match);

                accept(match);
              }
            );
          });
        })
        .catch(e => {
          console.log("Encountered an error getting TXT records:", e);
        });
    }
  };
};
