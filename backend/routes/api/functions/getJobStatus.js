let workQueue = require('../../../db/queue/queueConfig');
let redisOps = require('../../../db/redisOps');
let logError = require('../../../services/logging');

async function getJobStatus(req,res,next){
    
    let jobId = req.params.id;
    let job = await workQueue.getJob(jobId);
    
    if (job === null) {
        res.status(404).end();
    } else {

        let response = {};

        response.jobId = jobId;
        response.state = await job.getState();

        if(response.state != 'completed' && response.state != 'failed'){
            res.status(200).json(response);
        }

        else if(response.state == 'completed'){

            let jobResult = job.returnvalue;

            req.session.cache = jobResult.newCache;
            response.response = jobResult.response;

            setTimeout(deleteJobInfo,10000,jobId);

            res.status(200).json(response);
            
        }
        
        else if(job.failedReason){
            response.error = {};
            response.error.message = job.failedReason;
            response.error.stack = job.stacktrace[0];
            logError(`Failed job with reason "${job.failedReason}"`,job.data);
            res.status(200).json(response);
        }
        else{
            next();
        }  
    }
}

function deleteJobInfo(jobId){
    //redis key format -- bull:happy-soup:pgonzalez@test.com.uat:list-ApexClass1602182549998
    let redisKey = `bull:happy-soup:${jobId}`;
    redisOps.redisDel(redisKey);
}

module.exports = getJobStatus;