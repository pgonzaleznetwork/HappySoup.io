require('dotenv').config();
let version = process.env.SFDC_API_VERSION;

module.exports = {
    metadataApi:`/services/Soap/m/${version}`,
    soapApi:`/services/Soap/c/${version}`,
    reportsApi:`/services/data/v${version}/analytics/`,
    restApi:`/services/data/v${version}/`
}