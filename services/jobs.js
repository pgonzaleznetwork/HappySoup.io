//let redis = require('redis');
//let { promisify } = require("util");
let redisOps = require('../services/redisOps');
let metadataApi = require('../sfdc_apis/metadata');
let serverSessions = require('./serverSessions');
let {cacheApi} = require('./caching')
let dependencyApi = require('../sfdc_apis/dependencies');
let usageApi = require('../sfdc_apis/usage');
let toolingAPI = require('../sfdc_apis/tooling');



async function listMetadataJob(job){

    let {sessionId,mdtype} = job.data;
    let session = await getSession(sessionId);

    let results;

    if(shouldUseToolingApi(mdtype)){

      let toolingApi = toolingAPI(serverSessions.getConnection(session));

      let query = `SELECT Id,Name FROM ${mdtype}`;
      let soqlQuery = {query,filterById:false};
  
      let jsonResponse = await toolingApi.query(soqlQuery);
  
      results = jsonResponse.records.map(record => {
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
  
      results = jsonResponse.map(record => {
        return {
          name:record.fullName,
          id:record.id
        }
    });
    }

    let cache = cacheApi(session.cache);
    let cacheKey = `list-${mdtype}`;

    cache.cacheMetadataList(cacheKey,results);

    return {
      newCache:session.cache,
    }
  }
    

async function usageJob(job){

    let {entryPoint,cacheKey,sessionId} = job.data;
    let session = await getSession(sessionId);

    let cache = cacheApi(session.cache);
    let connection = serverSessions.getConnection(session);

    let api = usageApi(connection,entryPoint,cache);
    let response = await api.getUsage();

    cache.cacheUsage(cacheKey,response);

    return {
      newCache:session.cache,
    }
  }

async function dependencyJob(job){

    let {entryPoint,cacheKey,sessionId} = job.data;
    let session = await getSession(sessionId);

    let cache = cacheApi(session.cache);
    let connection = serverSessions.getConnection(session);

    let api = dependencyApi(connection,entryPoint,cache);
    let response = await api.getDependencies();
 
    cache.cacheDependency(cacheKey,response);

    return {
      newCache:session.cache,
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