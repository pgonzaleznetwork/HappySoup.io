let redis = require('redis');
let { promisify } = require("util");
let metadataApi = require('../sfdc_apis/metadata');
let serverSessions = require('./serverSessions');
let {cacheApi} = require('./caching')
let dependencyApi = require('../sfdc_apis/dependencies');
let usageApi = require('../sfdc_apis/usage');
let toolingAPI = require('../sfdc_apis/tooling');

let redisClient;

//if running on heroku
if (process.env.REDIS_URL){

  let redisUrl = require("url").parse(process.env.REDIS_URL);
  redisClient = redis.createClient(redisUrl.port, redisUrl.hostname);

  redisClient.auth(redisUrl.auth.split(":")[1]);

} else {
  //running locally
  redisClient = redis.createClient();
}

let redisGet = promisify(redisClient.get).bind(redisClient);
let redisSet = promisify(redisClient.set).bind(redisClient);

async function listMetadataJob(job){

    let {sessionId,mdtype} = job.data;
    let session = await getSession(sessionId);

    let results;

    if(shouldUseToolingApi(mdtype)){

      let toolingApi = toolingAPI(serverSessions.getConnection(session));

      let query = `SELECT Id,Name FROM ${mdtype}`;
      let soqlQuery = {query,filterById:false};
  
      let jsonResponse = await toolingApi.query(soqlQuery);
  
      results = jsonResponse.records.map(record => `${record.Name}:${record.Id}`)
    }
    //for any other metadata type, we use the Metadata API
    else {
      let mdapi = metadataApi(serverSessions.getConnection(session));
      results = await mdapi.listMetadata(mdtype);
  
      results = results.map(metadata => `${metadata.fullName}:${metadata.id}`);
    }

    let cache = cacheApi(session.cache);
    let cacheKey = `list-${mdtype}`;

    cache.cacheMetadataList(cacheKey,results);

    await commitSessionChanges(sessionId,session);}

async function usageJob(job){

    let {entryPoint,cacheKey,sessionId} = job.data;
    let session = await getSession(sessionId);

    let cache = cacheApi(session.cache);
    let connection = serverSessions.getConnection(session);

    let api = usageApi(connection,entryPoint,cache);
    let response = await api.getUsage();

    cache.cacheUsage(cacheKey,response);
  
    await commitSessionChanges(sessionId,session);}

async function dependencyJob(job){

    let {entryPoint,cacheKey,sessionId} = job.data;
    let session = await getSession(sessionId);

    let cache = cacheApi(session.cache);
    let connection = serverSessions.getConnection(session);

    let api = dependencyApi(connection,entryPoint,cache);
    let response = await api.getDependencies();
 
    cache.cacheDependency(cacheKey,response);

    await commitSessionChanges(sessionId,session);
}

async function commitSessionChanges(sessionId,session){
  await redisSet(sessionId,JSON.stringify(session));
}

async function getSession(sessionId){

    let result = await redisGet(sessionId);
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