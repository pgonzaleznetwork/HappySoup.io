let redisOps = require('../services/redisOps');
let {metadataAPI,restAPI} = require('sfdc-happy-api')();
let serverSessions = require('./serverSessions');
let {cacheApi} = require('./caching')
let {ErrorHandler} = require('../services/errorHandling');
let logError = require('../services/logging');
const sfdcSoup = require('sfdc-soup');



async function listMetadataJob(job){

    let {sessionId,mdtype} = job.data;
    let session = await getSession(sessionId);

    let results = [];

    if(mdtype == 'StandardField'){
      results.push(...getStandardFields());
    }

    else if(shouldUseToolingApi(mdtype)){

      let restApi = restAPI(serverSessions.getConnection(session),logError);

      let query = `SELECT Id,Name,NamespacePrefix FROM ${mdtype}`;
      let soqlQuery = {query,filterById:false,useToolingApi:true};
  
      let jsonResponse = await restApi.query(soqlQuery);

      if(!jsonResponse){
        let responseString = JSON.stringify(jsonResponse);
        logError(`Tooling API call failed`,{soqlQuery,responseString});
        throw new ErrorHandler(404,`Fault response from Tooling API query: ${responseString}`,'Fault response from listMetadata()'); 
      }
  
      //the response from the tooling api always returns a records array even if it's empty
      //so this operation is safe
      results = jsonResponse.records.map(record => {

        if(record.NamespacePrefix){
          record.Name = `${record.NamespacePrefix}.${record.Name}`;
        }

        return {
          name:record.Name,
          id:record.Id
        }
      });
    }
    //for any other metadata type, we use the Metadata API
    else {
      let mdapi = metadataAPI(serverSessions.getConnection(session),logError);
      let jsonResponse = await mdapi.listMetadata(mdtype);

      if(jsonResponse){
        //if multiple items are returned the response comes in array form
        if(Array.isArray(jsonResponse)){
          results = jsonResponse.map(record => {
            return {
              name:record.fullName,
              id:record.id || record.fullName//standard objects use their name as the id
            }
          });
        }
        else{
          //single item is returned as an object
          results.push({name:jsonResponse.fullName,id:jsonResponse.id});
        }
      }      
    }

    let cache = cacheApi(session.cache);
    let cacheKey = `list-${mdtype}`;

    cache.cacheMetadataList(cacheKey,results);

    return {
      newCache:session.cache,
      response:results
    }
  }
    

async function usageJob(job){

    let {entryPoint,sessionId} = job.data;
    let session = await getSession(sessionId);

    let cache = cacheApi(session.cache);
    let connection = serverSessions.getConnection(session);

    let soupApi = sfdcSoup(connection,entryPoint,cache);
    let response = await soupApi.getUsage();

    return {
      newCache:session.cache,
      response
    }
  }

async function dependencyJob(job){

    let {entryPoint,sessionId} = job.data;
    let session = await getSession(sessionId);

    let cache = cacheApi(session.cache);
    let connection = serverSessions.getConnection(session);

    let soupApi = sfdcSoup(connection,entryPoint,cache);
    let response = await soupApi.getDependencies();
 
    return {
      newCache:session.cache,
      response
    }

}


async function getSession(sessionId){

    let result = await redisOps.redisGet(sessionId);
    let session = JSON.parse(result);
    return session;
}

/**
* Retrieving ApexClass names with the listMetadata() call of the Metadata API is very very slow
* so for this specific metadata type, we use the Tooling API with the queryMore() call to be able to query
* the members in batches, which results in much better performance 
*
* On the other hand, email templates cannot be queried with listMetadata() unless you specify
* the folder name (which is a pain) so we fallback to the tooling api
*/
function shouldUseToolingApi(type){

  let types = ['ApexClass','EmailTemplate'];

  return types.includes(type);

}

function getStandardFields(){

  let allFields = [];
  let fieldsByObject = new Map();

  fieldsByObject.set('Opportunity',['StageName','Amount','CloseDate','IsClosed','ForecastCategory','HasOpportunityLineItem','Type','Probability','IsWon']);
  fieldsByObject.set('Account',['Industry','AccountNumber','AnnualRevenue','IsPersonAccount']);
  fieldsByObject.set('Case',['ClosedDate','Origin','Priority','Status','Type']);
  fieldsByObject.set('Contact',['Birthdate','LeadSource']);
  fieldsByObject.set('Lead', ['LeadSource','Industry','Status']);

  for (let [object, fields] of fieldsByObject) {
    
    fields.forEach(field => {
      let fullName = `${object}.${field}`;
      let fieldObj = {name:fullName,id:fullName};
      allFields.push(fieldObj);
    })

  }

  return allFields;


}

module.exports = {dependencyJob,usageJob,listMetadataJob};