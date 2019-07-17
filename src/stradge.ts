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

type Config = {AWS_ACCESS_KEY_ID: string, AWS_SECRET_ACCESS_KEY: string};

export const create = function(config: Config) {
  const client = new AWS.Route53({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
  });

  return {
    init: (opts: any):null => {
      return null;
    },
    zones: async (opts:any) => {
      try {
        let zones = await getZones(client);
        return zones.map(zone => zone.Name);
      } catch (e) {
        console.error("Error listing zones:", e);
        return null;
      }
    },
    set: async (data:any) => {
      let ch = data.challenge;
      let txt = ch.dnsAuthorization;

      console.log("Calling set:", txt);

      try {
        let zoneData = await getZones(client);
        let zone = zoneData.filter(zone => zone.Name === ch.dnsZone)[0];

        if (!zone) {
          console.error("Zone could not be found");
          return null;
        }

        let setResults = await client.changeResourceRecordSets({
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
        }).promise();

        console.log("Successfully set:", setResults.ChangeInfo);

        return true;
      } catch (e) {
        console.log("Error upserting txt record:", e);
        return null;
      }
    },

    remove: async (data:any) => {
      console.log("Calling remote");
      let ch = data.challenge;
      let txt = ch.dnsAuthorization;

      try {
        let zoneData = await getZones(client);
        let zone = zoneData.filter(zone => zone.Name === ch.dnsZone)[0];

        if (!zone) {
          console.error("Zone could not be found");
          return null;
        }

        await client.changeResourceRecordSets({
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
        }).promise();

        return true;
      } catch (e) {
        console.log("Encountered an error deleting the record:", e);
        return null;
      }
    },

    get: async (data: any) => {
      console.log("Calling get");
      let ch = data.challenge;
      let txt = ch.dnsAuthorization;

      try {
        let zoneData = await getZones(client);

        let zone = zoneData.filter(zone => zone.Name === ch.dnsZone)[0];

        if (!zone) {
          console.error("Zone could not be found");
          return null;
        }

        let data = await client.listResourceRecordSets({
          HostedZoneId: zone.Id
        }).promise();

        console.log("looking for: ", ch.dnsAuthorization);
        let tmatch = data.ResourceRecordSets.filter(rrs => rrs.Type === "TXT")
        .map(
          rrs =>
            rrs.ResourceRecords[0].Value.substring(
              1,
              rrs.ResourceRecords[0].Value.length - 1
            ) // remove quotes sorrounding the strings
        );
        console.log("data L132:", tmatch
        );

        let match = data.ResourceRecordSets.filter(rrs => rrs.Type === "TXT")
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

        if (!match || match.dnsAuthorization === undefined) {
          return null;
        }

        return match;
      } catch (e) {
        console.log("Encountered an error getting TXT records:", e);
        return null;
      }
    }
  };
};
