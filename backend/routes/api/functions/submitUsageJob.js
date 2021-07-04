let workQueue = require('../../../db/queueConfig');
let sessionValidation = require('../../../services/sessionValidation');

async function submitUsageJob(req,res,next)  {

    try {

        let entryPoint = {...req.query};
        entryPoint.options = JSON.parse(entryPoint.options);

        let jobDetails = {
            entryPoint,
            sessionId:sessionValidation.getSessionKey(req),
            jobType:'USAGE'
        }

        let jobId = `${sessionValidation.getIdentityKey(req)}:usage-${entryPoint.id}-${entryPoint.type}${Date.now()}`

        let job = await workQueue.add(jobDetails,{jobId});
        res.status(200).json({jobId:job.id});   

        
    } catch (error) {
        next(error);
    }     
}

module.exports = submitUsageJob;