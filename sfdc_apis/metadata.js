let fetch = require('node-fetch');
require('dotenv').config();
var xmlParser = require('fast-xml-parser');
let endpoints = require('./endpoints')
let {ErrorHandler} = require('../services/errorHandling');
let soapUtils = require('./soapUtils');
const logError = require('../services/logging');

function metadataAPI(connection){

    let soapURL = connection.url+endpoints.metadataApi;

    async function listMetadata(type){

        let soapBody = getListMetadataBody(connection,type);
        let fetchOptions = soapUtils.getFetchOptions(soapBody);

        try {
            let response = await fetch(soapURL,fetchOptions);
            let xml = await response.text();
        
            let json = xmlParser.parse(xml);
        
            //fetch didn't fail but the API response is invalid
            if(soapUtils.isSoapFailure(json)){
                logError('Failed SOAP response while calling listMetadata() on metadata API',{fetchOptions,json});
                throw new ErrorHandler(404,'no-sfdc-connection','Fault response from listMetadata()');  
            }
            else{
                let objectsData = json['soapenv:Envelope']['soapenv:Body'].listMetadataResponse.result;
                return objectsData;     
            }        

        } catch (error) {//fetch failed
            logError('Error while calling listMetadata() on metadata API',{fetchOptions,error});
            throw new ErrorHandler(404,'no-sfdc-connection','Fetch failed on listMetadata()');  
        }  
    }


    async function readMetadata(type,fullNames){

        //https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_readMetadata.htm
        const MAX_READMETADATA_LIMIT = 10;

        let batches = splitInBatchesOf(fullNames,MAX_READMETADATA_LIMIT);
        
        let allFetchOptions = batches.map(batch => {

            let soapBody = getReadMetadataBody(connection,type,batch);
            let fetchOptions = soapUtils.getFetchOptions(soapBody);
            return fetchOptions;

        });
       
        let data = await parallelFetch(type,soapURL,allFetchOptions);

        let allData = [];

        data.forEach(d => allData.push(...d));

        return allData;
    }

    return {
        listMetadata:listMetadata,
        readMetadata:readMetadata
    }

}


function getListMetadataBody(connection,type){

    let soapBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">
    <soapenv:Header>
       <met:SessionHeader>
          <met:sessionId>${connection.token}</met:sessionId>
       </met:SessionHeader>
    </soapenv:Header>
    <soapenv:Body>
       <met:listMetadata>
          <met:queries>
             <met:type>${type}</met:type>
          </met:queries>
          <met:asOfVersion>${process.env.SFDC_API_VERSION}</met:asOfVersion>
       </met:listMetadata>
    </soapenv:Body>
    </soapenv:Envelope>`

    return soapBody;
}



function getReadMetadataBody(connection,type,fullNames){

    let soapBodyTop = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">
    <soapenv:Header>
       <met:SessionHeader>
          <met:sessionId>${connection.token}</met:sessionId>
       </met:SessionHeader>
    </soapenv:Header>
    <soapenv:Body>
       <met:readMetadata>
          <met:type>${type}</met:type>`;

    let fullNamesPart = '';

    fullNames.forEach(fn => {
        fullNamesPart += `<met:fullNames>${fn}</met:fullNames>`
    })


    let soapBodyBottom = `</met:readMetadata>
    </soapenv:Body> 
    </soapenv:Envelope>`

    let soapBody = soapBodyTop+fullNamesPart+soapBodyBottom;

    return soapBody;

}

function splitInBatchesOf(items,batchSize){

    let remainingItems = items.length;
    let indexSoFar = 0;
    let batches = [];

    while (remainingItems > batchSize) {
        
        let batch = [];

        for (let x = 0; x < batchSize; x++,indexSoFar++) {
            batch.push(items[indexSoFar]);       
        }

        batches.push(batch);
        remainingItems -= batchSize;
    }

    if(remainingItems > 0) batches.push(items.slice(indexSoFar));

    return batches;

}

async function parallelFetch(type,url,fetchOptions){

    let data = await Promise.all(
        fetchOptions.map(async (fo) => {

            try {
                let res = await fetch(url,fo);
                let xml = await res.text();
                let json = xmlParser.parse(xml);

                if(soapUtils.isSoapFailure(json)){
                    let errorDetails = {
                        numberOfBatches:fetchOptions.length,
                        actualResponse:json,
                        sObjectType:type
                    };
                    logError('Failed SOAP response when calling metadataAPI.readMetadata()',errorDetails);
                    throw new ErrorHandler(404,'no-sfdc-connection','Fault response from readMetadata()');    
                }
                else{
                    let records = json['soapenv:Envelope']['soapenv:Body'].readMetadataResponse.result.records;

                    /**
                     * The calling code expects the data variable to be an array of arrays, which will be the case when the fetch request
                     * soap body contains more than one item to describe (i.e multiple custom fields). However, if the soap
                     * body only contains one item, it returns just that item, instead of an array.
                     * 
                     * So here we force the response to be an array, even if it's just a single item
                     */
                    if(!Array.isArray(records)){
                        return [records];
                    }

                    return records;
                }
            } catch (error) {
                //logError('Error while doing parallelFetch on metadata API',{fetchOptions,error});
                throw new ErrorHandler(404,'no-sfdc-connection','Fetch failed on readMetadata()');    
            }       
        })
    );

    return data;
}



module.exports = metadataAPI;