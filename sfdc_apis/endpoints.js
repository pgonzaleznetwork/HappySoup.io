require('dotenv').config();
let version = process.env.sfApiVersion;

module.exports = {
    toolingApi:`/services/data/v${version}/tooling/query/?q=`,
    metadataApi:`/services/Soap/m/${version}`,
    soapApi:`/services/Soap/c/${version}`
}