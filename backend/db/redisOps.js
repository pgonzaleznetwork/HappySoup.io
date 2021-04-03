let redis = require('redis');
let { promisify } = require("util");
let redisConfig = require('./redisConfig');

let redisClient = redis.createClient(redisConfig.port,redisConfig.host);
if(redisConfig.password){
  redisClient.auth(redisConfig.password);
}

let redisGet = promisify(redisClient.get).bind(redisClient);
let redisSet = promisify(redisClient.set).bind(redisClient);
let redisDel = promisify(redisClient.del).bind(redisClient);

module.exports = {redisGet,redisSet,redisDel};
