let fetch = require('node-fetch');
require('dotenv').config();
let {ErrorHandler} = require('../services/errorHandling');
let endpoints = require('./endpoints');


function toolingAPI(connection){

    async function query(queryString){

        let endpoint = connection.url+endpoints.toolingApi;
        let request = endpoint+encodeURIComponent(queryString);
    
        let options = getFetchOptions(connection.token);    
                
        try {
            
            let res = await fetch(request,options);
            let json = await res.json();
           
            if(isFailedResponse(json)){
                throw new ErrorHandler(404,'no-sfdc-connection','Fault response from Tooling API query');
            }
            else{
                return json;
            }

        } catch (error) {
            throw new ErrorHandler(404,'no-sfdc-connection','Fetch failed on Tooling API query');
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