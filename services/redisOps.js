let redis = require('redis');
let { promisify } = require("util");

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
let redisDel = promisify(redisClient.del).bind(redisClient);

module.exports = {redisGet,redisSet,redisDel};
