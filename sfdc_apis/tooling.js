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
                let apiError = new Error();
                apiError.statusCode = 404;
                apiError.name = 'no-sfdc-connection';
                apiError.message = json[0].message;
                apiError.sfdcApi = true;
                throw apiError;
                //throw new ErrorHandler(404,'no-sfdc-connection','Fault response from Tooling API query');
            }
            else{
                return json;
            }

        } catch (error) {
            //if it's an API error, throw it as is
            if(error.sfdcApi){
                throw error;
            }
            else{//otherwise it could be a network error
                throw new ErrorHandler(404,'no-sfdc-connection','Fetch failed on Tooling API query');
            }
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