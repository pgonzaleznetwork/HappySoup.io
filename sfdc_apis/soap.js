let fetch = require('node-fetch');
require('dotenv').config();
var xmlParser = require('fast-xml-parser');
let fs = require('fs');
let endpoints = require('./endpoints');
let {ErrorHandler} = require('../services/errorHandling');
let soapUtils = require('./soapUtils');

function soapAPI(connection){

    let soapURL = connection.url+endpoints.soapApi;

    async function getServerTimestamp(){

        let body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:enterprise.soap.sforce.com">
            <soapenv:Header>
            <urn:SessionHeader>
                <urn:sessionId>${connection.token}</urn:sessionId>
            </urn:SessionHeader>
            </soapenv:Header>
            <soapenv:Body>
            <urn:getServerTimestamp/>
            </soapenv:Body>
        </soapenv:Envelope>`

        try {

            let fetchOptions = soapUtils.getFetchOptions(body);
            let response = await fetch(soapURL,fetchOptions);

            let xml = await response.text();
            let json = xmlParser.parse(xml);

            return json;

        } catch (error) {//if fetch fails i.e network error
            throw new ErrorHandler(404,'no-sfdc-connection','Fetch failed on getServerTimeStamp()');   
        }
    }

    async function logout(){

        let body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:enterprise.soap.sforce.com">
        <soapenv:Header>
           <urn:SessionHeader>
              <urn:sessionId>${connection.token}</urn:sessionId>
           </urn:SessionHeader>
            </soapenv:Header>
            <soapenv:Body>
            <urn:logout/>
            </soapenv:Body>
        </soapenv:Envelope>`

        let fetchOptions = soapUtils.getFetchOptions(body);
        await fetch(soapURL,fetchOptions);
        
        return;

    }

    return {
        getServerTimestamp,
        logout
    }

}

module.exports = soapAPI;


