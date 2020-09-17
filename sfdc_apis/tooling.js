let fetch = require('node-fetch');
require('dotenv').config();
let {ErrorHandler} = require('../services/errorHandling');
let endpoints = require('./endpoints');


function toolingAPI(connection){

    async function query(queryString){

        let endpoint = connection.url+endpoints.toolingApi;
        let request = endpoint+encodeURIComponent(queryString);
    
        let options = getFetchOptions(connection.token);    
    
        let res = await fetch(request,options);

        if(!res.ok){

            showIds(queryString);

            throw new ErrorHandler(res.status,res.statusText,'Fetch failed on Tooling API query');
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

function getIds(queryString){

    console.log('queryString length',queryString.length);

    let startParenthesis = queryString.indexOf('(');
    let endParenthesis = queryString.indexOf(')');

    let idFilter = queryString.substring(startParenthesis+1,endParenthesis);

    let ids = idFilter.split(',');

    console.log('how many ids',ids.length);

    return ids;
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