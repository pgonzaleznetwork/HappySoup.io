let workQueue = require('../../../db/queue/queueConfig');
let sessionValidation = require('../../../services/sessionValidation');

async function submitBulkUsageJob(req,res,next)  {

    try {

        let {ids} = req.body;
        
        let jobDetails = {
            ids,
            sessionId:sessionValidation.getSessionKey(req),
            jobType:'BULK_USAGE'
        }

        let jobId = `${sessionValidation.getIdentityKey(req)}:bulkusage-${Date.now()}`

        let job = await workQueue.add(jobDetails,{jobId});
        res.status(201).json({jobId:job.id});   

        
    } catch (error) {
        next(error);
    }     
}

module.exports = submitBulkUsageJob;