let fetch = require('node-fetch');
require('dotenv').config();
let {ErrorHandler} = require('../services/errorHandling');
let endpoints = require('./endpoints');
let utils = require('../services/utils');
let logError = require('../services/logging');


function toolingAPI(connection){

    async function query(soqlQuery){

        let jsonResponse;
        let endpoint;

        if(soqlQuery.apiVersionOverride){
            let versionEndpoint = overrideApiVersion(endpoints.toolingApi,soqlQuery.apiVersionOverride);
            endpoint = connection.url+versionEndpoint;
        }
        else{
            endpoint = connection.url+endpoints.toolingApi;
        }

        let request = endpoint+encodeURIComponent(soqlQuery.query); 
        let options = getFetchOptions(connection.token);    

        if(soqlQuery.filterById && tooManyIds(soqlQuery.query)){
            jsonResponse = await tryWithSmallerQueries(soqlQuery.query,endpoint,options);
        }

        else{

            let res = await fetch(request,options);
        
            if(!res.ok){
                
                if(hitRequestSizeLimit(res)){
                    jsonResponse = await tryWithSmallerQueries(soqlQuery.query,endpoint,options);
                }

                else {
                    logError(`Tooling API call failed`,{request,res});
                    throw new ErrorHandler(res.status,res.statusText,'Fetch failed on Tooling API query');
                } 
            }

            else{

                jsonResponse = await res.json();

                if(isFailedResponse(jsonResponse)){
                    logError(`Tooling API call failed`,{request,jsonResponse});
                    throw createApiError(jsonResponse);
                }
    
                if(!jsonResponse.done){
                    let queryMoreRequest = getQueryMoreRequest();
                    await queryMoreRequest.exec(jsonResponse.nextRecordsUrl,connection,options);
                    jsonResponse.records.push(...queryMoreRequest.getRecords());
                }
            }  
        }

        return jsonResponse;
    }

    return {query}

}

function createApiError(jsonResponse){
    let apiError = new Error();
    apiError.statusCode = 404;
    apiError.name = 'no-sfdc-connection';
    apiError.message = jsonResponse[0].message;
    return apiError;
}


function getQueryMoreRequest(){

    let records = [];

    async function exec(nextRecordsUrl,connection,fechOptions){

        let endpoint = connection.url+nextRecordsUrl;
        let res = await fetch(endpoint,fechOptions);

        if(!res.ok){            
            throw new ErrorHandler(res.status,res.statusText,'Fetch failed on Tooling API query');
        }

        let jsonResponse = await res.json();

        if(isFailedResponse(jsonResponse)){
            throw createApiError(jsonResponse);
        }

        records.push(...jsonResponse.records);

        if(!jsonResponse.done){
            await exec(jsonResponse.nextRecordsUrl,connection,fechOptions);
        }
    }

    function getRecords(){
        return records;
    }

    return {exec,getRecords};
}

function tooManyIds(queryString){
    let allIds = getIds(queryString);
    return (allIds.length > 300);
}

function hitRequestSizeLimit(res){

    let tooLargeReponseValues = ['Request Header Fields Too Large','URI Too Long'];
    let tooLargeStatusCodes = ['414','431'];

    return (tooLargeReponseValues.includes(res.statusText) || tooLargeStatusCodes.includes(res.status));

}

async function tryWithSmallerQueries(queryString,endpoint,options){

    let allIds = getIds(queryString);
    let batches = utils.splitInBatchesOf(allIds,100);

    let queryParts = getSOQLWithoutIds(queryString);
    let [selectClause,afterFilters] = queryParts;

    let smallerQueries = batches.map(batch => {

        let ids = batch.join(',');
        let query = `${selectClause} (${ids}) ${afterFilters}`;
        return query;

    });

    let data = await Promise.all(

        smallerQueries.map(async (smallQuery) => {

            let request = endpoint+encodeURIComponent(smallQuery);  
            
            let res = await fetch(request,options);

            if(res.ok){

                let json = await res.json();

                if(isFailedResponse(json)){
                    throw createApiError(json);
                    
                }
                else{
                    return json;
                }

            }else{
                throw new ErrorHandler(res.status,res.statusText,'Fetch failed on Tooling API query');
            }
        })
    );

    let response = {};
    response.records = [];

    data.map(d => {
        response.records.push(...d.records);
    });

    return response;

}

function getIds(queryString){

    let startParenthesis = queryString.indexOf('(');
    let endParenthesis = queryString.indexOf(')');

    let idFilter = queryString.substring(startParenthesis+1,endParenthesis);

    let ids = idFilter.split(',');

    return ids;
}

function getSOQLWithoutIds(queryString){

    let startParenthesis = queryString.indexOf('(');
    let endParenthesis = queryString.indexOf(')');

    let selectClause = queryString.substring(0,startParenthesis);
    let afterFilters = queryString.substring(endParenthesis+1);

    let parts = [selectClause,afterFilters];

    return parts;
}


function getFetchOptions(token){
    return {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
    }
}

function isFailedResponse(json){

    if(json[0] && json[0]['errorCode']){
        return true;
    }
    return false;
}

/**
 * Sometimes the client needs to be able to specify the API version, for example when querying fields that only exists in certain
 * versions of the API (for example the TableEnumOrId is only available in version 33.0 for the ValidationRule object)
 */
function overrideApiVersion(endpoint,newVersion){

    let apiPath = endpoint.indexOf('/v');
    let apiPathLength = 7; //>> /v45.0/

    let start = endpoint.substring(0,apiPath);
    let end = endpoint.substring(apiPath+apiPathLength,endpoint.length);

    let newApiPath = `/v${newVersion}/`;

    let newEndpoint = start+newApiPath+end;

    return newEndpoint;
}

module.exports = toolingAPI;