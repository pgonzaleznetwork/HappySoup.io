let throng = require('throng');
let Queue = require("bull");
let jobs = require('./jobs');

// Connect to a local redis instance locally, and the Heroku-provided URL in production
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
const workers = process.env.WEB_CONCURRENCY || 2;

// The maximum number of jobs each worker should process at once. This will need
// to be tuned for your application. If each job is mostly waiting on network 
// responses it can be much higher. If each job is CPU-intensive, it might need
// to be much lower.
const maxJobsPerWorker = 50;

function start() {
  // Connect to the named work queue
  let workQueue = new Queue('work', REDIS_URL);

  workQueue.process(maxJobsPerWorker, async (job) => {

    let {jobType} = job.data;

    switch(jobType) {
        case 'LIST_METADATA':
            await jobs.listMetadataJob(job);
            break;
        case 'DEPENDENCIES':
            await jobs.dependencyJob(job);
            break;
        case 'USAGE':
            await jobs.usageJob(job);
            break;
    }

    // A job can return values that will be stored in Redis as JSON
    // This return value is unused in this demo application.
    return null;
  });
}


// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start });
