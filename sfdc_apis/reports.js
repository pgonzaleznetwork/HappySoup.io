let fetch = require('node-fetch');
require('dotenv').config();
let logError = require('../services/logging');
let endpoints = require('./endpoints');


function reportsAPI(connection){

    async function getReportsMetadata(reportIds){

        let data = await Promise.all(

            reportIds.map(async (reportId) => {
    
                let request = `${connection.url}${endpoints.reportsApi}reports/${reportId}/describe`; 
                let options = getFetchOptions(connection.token);

                try {
                    let res = await fetch(request,options);
                    let json = await res.json();

                    return json;
                } catch (error) {
                    //if one report throws an error here, we can move on to the next
                    //one because this is not critical functionality
                    logError(`Report API call failed`,{request,error});
                }
                
                
            })
        );
    
        let response = {};
        response.records = [];
    
        data.map(d => {
            response.records.push(d);
        });
    
        return response;

    }

    return {getReportsMetadata}

}

function getFetchOptions(token){
    return {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
    }
}

module.exports = reportsAPI;