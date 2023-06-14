let redis = require('redis');
let { promisify } = require("util");
let redisConfig = require('./redisConfig');

console.log('before redis create client');
console.log(redisConfig);
let redisClient = redis.createClient(redisConfig);
console.log('after redis create client');
if(redisConfig.password){
  redisClient.auth(redisConfig.password);
}

//(async () => { await redisClient.connect(); })();

let redisGet = promisify(redisClient.get).bind(redisClient);
let redisSet = promisify(redisClient.set).bind(redisClient);
let redisDel = promisify(redisClient.del).bind(redisClient);

module.exports = {redisGet,redisSet,redisDel};
