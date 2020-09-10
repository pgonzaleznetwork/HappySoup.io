let redis = require('redis');
let { promisify } = require("util");
let metadataApi = require('../sfdc_apis/metadata');
let serverSessions = require('./serverSessions');
let {cacheApi} = require('./caching')
let dependencyApi = require('../sfdc_apis/dependencies');
let usageApi = require('../sfdc_apis/usage');

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

    let mdapi = metadataApi(serverSessions.getConnection(session));
    let results = await mdapi.listMetadata(mdtype);

    results = results.map(r => `${r.fullName}:${r.id}`);

    let cache = cacheApi(session.cache);
    let cacheKey = `list-${mdtype}`;

    cache.cacheMetadataList(cacheKey,results);

    await redisSet(sessionId,JSON.stringify(session));
}

async function usageJob(job){

    let {entryPoint,cacheKey,sessionId} = job.data;
    let session = await getSession(sessionId);

    let cache = cacheApi(session.cache);
    let connection = serverSessions.getConnection(session);

    let api = usageApi(connection,entryPoint,cache);
    let response = await api.getUsage();

    cache.cacheUsage(cacheKey,response);
  
    await redisSet(sessionId,JSON.stringify(session));
}

async function dependencyJob(job){

    let {entryPoint,cacheKey,sessionId} = job.data;
    let session = await getSession(sessionId);

    let cache = cacheApi(session.cache);
    let connection = serverSessions.getConnection(session);

    let api = dependencyApi(connection,entryPoint,cache);
    let response = await api.getDependencies();

    cache.cacheDependency(cacheKey,response);

    await redisSet(sessionId,JSON.stringify(session));
}

async function getSession(sessionId){

    let result = await redisGet(sessionId);
    let session = JSON.parse(result);
    return session;
}

module.exports = {dependencyJob,usageJob,listMetadataJob};