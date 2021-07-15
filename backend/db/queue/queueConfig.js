let Queue = require('bull');
let {url} = require('../redisConfig');
const QUEUE_NAME = 'happy-soup';
let workQueue = new Queue(QUEUE_NAME, url);

module.exports = workQueue;