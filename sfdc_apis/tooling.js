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
    
        let res = await fetch(request,options);

        if(!res.ok){

            if(urlIsTooLong(res)){
                tryAgainWithLessIds(queryString);
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

    return {query}

}

function urlIsTooLong(res){
    return (res.status == '414' || res.statusText == 'URI Too Long');
}

function tryAgainWithLessIds(queryString){

    let allIds = getIds(queryString);
    let batches = utils.splitInBatchesOf(allIds,300);

    let queryParts = getSOQLWithoutIds(queryString);
    let [selectClause,afterFilters] = queryParts;

    let smallerQueries = batches.map(batch => {

        console.log('batch size',batch.length);
        console.log('actual batch',batch);

        let ids = utils.filterableId(batch);
        let query = `${selectClause} ('${ids}') ${afterFilters}`;
        console.log('SMALLER QUERY ',query);

    });

}

function getIds(queryString){

    console.log('queryString length',queryString.length);

    let startParenthesis = queryString.indexOf('(');
    let endParenthesis = queryString.indexOf(')');

    let idFilter = queryString.substring(startParenthesis+1,endParenthesis);
    idFilter = idFilter.substring(1,idFilter.length-2);

    let ids = idFilter.split(',');

    ids = ids.map(id => {
        return id.substring(1,id.length-2);
    })

    console.log('how many ids',ids.length);

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