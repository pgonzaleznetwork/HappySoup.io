let fetch = require('node-fetch');
require('dotenv').config();
let {ErrorHandler} = require('../services/errorHandling');
let endpoints = require('./endpoints');
let utils = require('../services/utils');


function reportsAPI(connection){

    async function getReportsMetadata(reportIds){

        let data = await Promise.all(

            reportIds.map(async (reportId) => {
    
                let request = `${connection.url}${endpoints.reportsApi}reports/${reportId}/describe`; 
                let options = getFetchOptions(connection.token)
                
                let res = await fetch(request,options);
                let json = await res.json();

                return json;
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