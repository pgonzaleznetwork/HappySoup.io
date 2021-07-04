let workQueue = require('../../../db/queueConfig');
let sessionValidation = require('../../../services/sessionValidation');

async function submitDependencyJob(req,res,next) {

    try {

        let entryPoint = {...req.query};

        let jobDetails = {
            entryPoint,
            sessionId:sessionValidation.getSessionKey(req),
            jobType:'DEPENDENCIES'
        }

        let jobId = `${sessionValidation.getIdentityKey(req)}:deps-${entryPoint.id}-${entryPoint.type}${Date.now()}`

        let job = await workQueue.add(jobDetails,{jobId});
        res.status(200).json({jobId:job.id});   
        

    } catch (error) {
        next(error);
    }     
}

module.exports = submitDependencyJob;