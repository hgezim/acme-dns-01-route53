import * as AWS from 'aws-sdk';

const getZones = async (client: AWS.Route53) => {
  try {
    let data = await client.listHostedZonesByName().promise();
    let zoneData = data.HostedZones.map(zone => {
      // drop '.' at the end of each zone
      zone.Name = zone.Name.substr(0, zone.Name.length - 1);
      return zone;
    });

    if (data.IsTruncated) {
      throw 'Too many records to deal with. Some are truncated';
    }

    return zoneData;
  } catch (e) {
    throw e;
  }
};

const getChange = async (client: AWS.Route53, changeId: string) => {
  try {
    let change = await client.getChange({Id: changeId}).promise();
    return change;
  } catch (e) {
    console.log(`Error polling for change: ${changeId}:`, e);
    throw e;
  }
};

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

type Config = {AWS_ACCESS_KEY_ID: string; AWS_SECRET_ACCESS_KEY: string};

export const create = function(config: Config) {
  const client = new AWS.Route53({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  });

  return {
    init: (opts: any): null => {
      return null;
    },
    zones: async (opts: any) => {
      try {
        let zones = await getZones(client);
        return zones.map(zone => zone.Name);
      } catch (e) {
        console.error('Error listing zones:', e);
        return null;
      }
    },
    set: async (data: any) => {
      let ch = data.challenge;
      let txt = ch.dnsAuthorization;

      console.log('Calling set:', txt);

      try {
        let zoneData = await getZones(client);
        let zone = zoneData.filter(zone => zone.Name === ch.dnsZone)[0];

        if (!zone) {
          console.error('Zone could not be found');
          return null;
        }

        let data = await client
          .listResourceRecordSets({
            HostedZoneId: zone.Id,
          })
          .promise();

        let recordName = `${ch.dnsPrefix}.${ch.dnsZone}`;

        console.log(
          `Could not find existing records for ${recordName} in \n\t in:`,
          data.ResourceRecordSets.map(rrs => {
            return {
              name: rrs.Name,
              value: rrs.ResourceRecords.map(rrs => rrs.Value).join(','),
            };
          })
        );

        // check if record name already exists
        let existingRecord = data.ResourceRecordSets.map(rrs => {
          rrs.Name = rrs.Name.slice(0, -1); // remote last .
          return rrs;
        }).filter(rrs => rrs.Name === recordName);
        const newRecord = {Value: `"${txt}"`};
        let resourceRecords: {Value: string}[] = [];
        if (existingRecord.length) {
          console.log('Record exists for:', recordName, ' ', existingRecord);
          resourceRecords = [...existingRecord[0].ResourceRecords, newRecord];
          console.log(
            '\t setting it to:',
            resourceRecords.map(rrs => rrs.Value).join(',')
          );
        } else {
          resourceRecords = [newRecord];
        }

        let setResults = await client
          .changeResourceRecordSets({
            HostedZoneId: zone.Id,
            ChangeBatch: {
              Changes: [
                {
                  Action: 'UPSERT',
                  ResourceRecordSet: {
                    Name: recordName,
                    Type: 'TXT',
                    TTL: 300,
                    ResourceRecords: resourceRecords,
                  },
                },
              ],
              Comment: 'Updated txt record for Gezim', // TODO: fix this to make sense
            },
          })
          .promise();

        console.log(
          `Successfully set ${ch.dnsPrefix}.${ch.dnsZone} to "${txt}"`
        );

        let status = setResults.ChangeInfo.Status;
        // while (status === 'PENDING') {
        //   const timeout = 5000;
        //   console.log(
        //     `\t but ... change is still pending. Will check again in ${timeout /
        //       1000} seconds.`
        //   );
        //   // await sleep(timeout);
        //   let change = await getChange(client, setResults.ChangeInfo.Id);
        //   status = change.ChangeInfo.Status;
        // }

        return true;
      } catch (e) {
        console.log('Error upserting txt record:', e);
        return null;
      }
    },

    remove: async (data: any) => {
      console.log('Calling remove');
      let ch = data.challenge;
      let txt = ch.dnsAuthorization;

      try {
        let zoneData = await getZones(client);
        let zone = zoneData.filter(zone => zone.Name === ch.dnsZone)[0];

        if (!zone) {
          console.error('Zone could not be found');
          return null;
        }

        // find record first
        let data = await client
          .listResourceRecordSets({
            HostedZoneId: zone.Id,
          })
          .promise();

          console.log(
            'L173 hehe: \n\t in:',
            data.ResourceRecordSets.map(rrs => {
              return {
                name: rrs.Name,
                value: rrs.ResourceRecords.map(rrs => rrs.Value).join(','),
              };
            })
          );

        let match = data.ResourceRecordSets.filter(
          rrs => rrs.ResourceRecords.filter(txtRs => txtRs.Value.slice(1,-1) === txt).length
        )[0];

        let recordName = `${ch.dnsPrefix}.${ch.dnsZone}`;

        // if more than one recordset, remove the one we don't want and keep the rest
        if (match && match.ResourceRecords.length > 1) {
          console.log("upserting to delete a record:", recordName);
          // upsert
          let rr = match.ResourceRecords.filter(rr => rr.Value.slice(1, -1) !== txt);
          console.log("rr:", rr.map(r => r.Value));
          await client
          .changeResourceRecordSets({
            HostedZoneId: zone.Id,
            ChangeBatch: {
              Changes: [
                {
                  Action: 'UPSERT',
                  ResourceRecordSet: {
                    Name: recordName,
                    Type: 'TXT',
                    TTL: 300,
                    ResourceRecords: rr,
                  },
                },
              ],
              Comment: 'Updated txt record for Gezim', // TODO: fix this to make sense
            },
          })
          .promise();
        } else {
          // delete
          console.log("deleting record for:", recordName);
          await client
          .changeResourceRecordSets({
            HostedZoneId: zone.Id,
            ChangeBatch: {
              Changes: [
                {
                  Action: 'DELETE',
                  ResourceRecordSet: {
                    Name: recordName,
                    Type: 'TXT',
                    TTL: 300,
                    ResourceRecords: match.ResourceRecords
                  },
                },
              ],
              Comment: 'Delete txt record for Gezim', // TODO: fix this to make sense
            },
          })
          .promise();
        }

        return true;
      } catch (e) {
        console.log('Encountered an error deleting the record:', e);
        return null;
      }
    },

    get: async (data: any) => {
      console.log('Calling get');
      let ch = data.challenge;
      let txt = ch.dnsAuthorization;

      try {
        let zoneData = await getZones(client);

        let zone = zoneData.filter(zone => zone.Name === ch.dnsZone)[0];

        if (!zone) {
          console.error('Zone could not be found');
          return null;
        }

        let data = await client
          .listResourceRecordSets({
            HostedZoneId: zone.Id,
          })
          .promise();

        if (data.IsTruncated) {
          throw 'Too many records to deal with. Some are truncated';
        }

        data.ResourceRecordSets.reduce((acc, currentValue) => {
          if (
            currentValue.ResourceRecords.filter(
              rrs => rrs.Value.slice(1, -1) === ch.dnsAuthorization
            )
          ) {
          }
          return acc;
        });

        let match = data.ResourceRecordSets.filter(rrs => rrs.Type === 'TXT')
          .map(rrs => {
            let val = rrs.ResourceRecords.map(rec => rec.Value.slice(1, -1)); // remove quotes sorrounding the strings
            return val;
          })
          .filter(txtRecords => {
            let val = txtRecords.filter(rec => rec === ch.dnsAuthorization);
            return val.length;
          })
          .map(txtRec => {
            let match = txtRec.filter(rec => rec === ch.dnsAuthorization)[0];
            return {dnsAuthorization: match};
          })[0];

        if (!match || match.dnsAuthorization === undefined) {
          return null;
        }

        return match;
      } catch (e) {
        console.log('Encountered an error getting TXT records:', e);
        return null;
      }
    },
  };
};
