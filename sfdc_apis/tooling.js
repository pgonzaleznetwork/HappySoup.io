let fetch = require('node-fetch');
require('dotenv').config();
let {ErrorHandler} = require('../services/errorHandling');
let endpoints = require('./endpoints');
let utils = require('../services/utils');


function toolingAPI(connection){

    async function query(queryString){

        let endpoint = connection.url+endpoints.toolingApi;
        let request = endpoint+encodeURIComponent(queryString); 
        let options = getFetchOptions(connection.token);    

        if(tooManyIds(queryString)){
            let json = await tryWithSmallerQueries(queryString,endpoint,options);
            return json;
        }
        else{

            let res = await fetch(request,options);
        
            if(!res.ok){

                if(hitRequestSizeLimit(res)){
                    let json = await tryWithSmallerQueries(queryString,endpoint,options);
                    return json;
                }

                else{
                    throw new ErrorHandler(res.status,res.statusText,'Fetch failed on Tooling API query');
                }  
            }

            let json = await res.json();

            if(isFailedResponse(json)){
                let apiError = new Error();
                apiError.statusCode = 404;
                apiError.name = 'no-sfdc-connection';
                apiError.message = json[0].message;
                throw apiError;
                
            }
            else{
                return json;
            }
        }
    }

    return {query}

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
                    let apiError = new Error();
                    apiError.statusCode = 404;
                    apiError.name = 'no-sfdc-connection';
                    apiError.message = json[0].message;
                    throw apiError;
                    
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

module.exports = toolingAPI;