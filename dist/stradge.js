"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var AWS = require("aws-sdk");
var getZones = function (client) { return __awaiter(_this, void 0, void 0, function () {
    var data, zoneData, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, client.listHostedZonesByName().promise()];
            case 1:
                data = _a.sent();
                zoneData = data.HostedZones.map(function (zone) {
                    // drop '.' at the end of each zone
                    zone.Name = zone.Name.substr(0, zone.Name.length - 1);
                    return zone;
                });
                return [2 /*return*/, zoneData];
            case 2:
                e_1 = _a.sent();
                throw e_1;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.create = function (config) {
    var _this = this;
    var client = new AWS.Route53({
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY
    });
    return {
        init: function (opts) {
            return null;
        },
        zones: function (opts) { return __awaiter(_this, void 0, void 0, function () {
            var zones, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, getZones(client)];
                    case 1:
                        zones = _a.sent();
                        return [2 /*return*/, zones.map(function (zone) { return zone.Name; })];
                    case 2:
                        e_2 = _a.sent();
                        console.error("Error listing zones:", e_2);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        set: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var ch, txt, zoneData, zone, setResults, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ch = data.challenge;
                        txt = ch.dnsAuthorization;
                        console.log("Calling set:", txt);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, getZones(client)];
                    case 2:
                        zoneData = _a.sent();
                        zone = zoneData.filter(function (zone) { return zone.Name === ch.dnsZone; })[0];
                        if (!zone) {
                            console.error("Zone could not be found");
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, client.changeResourceRecordSets({
                                HostedZoneId: zone.Id,
                                ChangeBatch: {
                                    Changes: [
                                        {
                                            Action: "UPSERT",
                                            ResourceRecordSet: {
                                                Name: ch.dnsPrefix + "." + ch.dnsZone,
                                                Type: "TXT",
                                                TTL: 300,
                                                ResourceRecords: [{ Value: "\"" + txt + "\"" }]
                                            }
                                        }
                                    ],
                                    Comment: "Updated txt record for Gezim" // TODO: fix this to make sense
                                }
                            }).promise()];
                    case 3:
                        setResults = _a.sent();
                        console.log("Successfully set:", setResults.ChangeInfo);
                        return [2 /*return*/, true];
                    case 4:
                        e_3 = _a.sent();
                        console.log("Error upserting txt record:", e_3);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        }); },
        remove: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var ch, txt, zoneData, zone, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Calling remote");
                        ch = data.challenge;
                        txt = ch.dnsAuthorization;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, getZones(client)];
                    case 2:
                        zoneData = _a.sent();
                        zone = zoneData.filter(function (zone) { return zone.Name === ch.dnsZone; })[0];
                        if (!zone) {
                            console.error("Zone could not be found");
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, client.changeResourceRecordSets({
                                HostedZoneId: zone.Id,
                                ChangeBatch: {
                                    Changes: [
                                        {
                                            Action: "DELETE",
                                            ResourceRecordSet: {
                                                Name: ch.dnsPrefix + "." + ch.dnsZone,
                                                Type: "TXT",
                                                TTL: 300
                                            }
                                        }
                                    ],
                                    Comment: "Delete txt record for Gezim" // TODO: fix this to make sense
                                }
                            }).promise()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 4:
                        e_4 = _a.sent();
                        console.log("Encountered an error deleting the record:", e_4);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        }); },
        get: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var ch, txt, zoneData, zone, data_1, tmatch, match, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Calling get");
                        ch = data.challenge;
                        txt = ch.dnsAuthorization;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, getZones(client)];
                    case 2:
                        zoneData = _a.sent();
                        zone = zoneData.filter(function (zone) { return zone.Name === ch.dnsZone; })[0];
                        if (!zone) {
                            console.error("Zone could not be found");
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, client.listResourceRecordSets({
                                HostedZoneId: zone.Id
                            }).promise()];
                    case 3:
                        data_1 = _a.sent();
                        console.log("looking for: ", ch.dnsAuthorization);
                        tmatch = data_1.ResourceRecordSets.filter(function (rrs) { return rrs.Type === "TXT"; })
                            .map(function (rrs) {
                            return rrs.ResourceRecords[0].Value.substring(1, rrs.ResourceRecords[0].Value.length - 1);
                        } // remove quotes sorrounding the strings
                        );
                        console.log("data L132:", tmatch);
                        match = data_1.ResourceRecordSets.filter(function (rrs) { return rrs.Type === "TXT"; })
                            .map(function (rrs) {
                            return rrs.ResourceRecords[0].Value.substring(1, rrs.ResourceRecords[0].Value.length - 1);
                        } // remove quotes sorrounding the strings
                        )
                            .filter(function (txtRecord) { return txtRecord == ch.dnsAuthorization; })
                            .map(function (txtRec) {
                            return { dnsAuthorization: txtRec };
                        })[0];
                        console.log("returning match:", match);
                        if (!match || match.dnsAuthorization === undefined) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, match];
                    case 4:
                        e_5 = _a.sent();
                        console.log("Encountered an error getting TXT records:", e_5);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        }); }
    };
};
