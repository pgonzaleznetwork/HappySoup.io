let Queue = require('bull');
let {url} = require('../redisConfig');
let workQueue = new Queue(process.env.QUEUE_NAME, url);

module.exports = workQueue;