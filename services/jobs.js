let redisOps = require('../services/redisOps');
let metadataApi = require('../sfdc_apis/metadata');
let serverSessions = require('./serverSessions');
let {cacheApi} = require('./caching')
let dependencyApi = require('../sfdc_apis/dependencies');
let usageApi = require('../sfdc_apis/usage');
let restAPI = require('../sfdc_apis/rest');
let {ErrorHandler} = require('../services/errorHandling');
let logError = require('../services/logging');



async function listMetadataJob(job){

    let {sessionId,mdtype} = job.data;
    let session = await getSession(sessionId);

    let results = [];

    if(shouldUseToolingApi(mdtype)){

      let restApi = restAPI(serverSessions.getConnection(session));

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
      let mdapi = metadataApi(serverSessions.getConnection(session));
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

    let api = usageApi(connection,entryPoint,cache);
    let response = await api.getUsage();

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

    let api = dependencyApi(connection,entryPoint,cache);
    let response = await api.getDependencies();
 
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

module.exports = {dependencyJob,usageJob,listMetadataJob};