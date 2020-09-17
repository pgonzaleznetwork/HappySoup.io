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