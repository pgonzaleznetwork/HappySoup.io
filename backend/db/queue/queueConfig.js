let Queue = require('bull');
let {url} = require('../redisConfig');
let redisConfig = require('../redisConfig');
let workQueue = new Queue(process.env.QUEUE_NAME, 
    {redis:redisConfig}
);

module.exports = workQueue;