let workQueue = require('../../../db/queue/queueConfig');
let sessionValidation = require('../../../services/sessionValidation');

async function submitBoundaryJob(req,res,next) {

    try {

        let {entryPoint} = req.body;

        let jobDetails = {
            entryPoint,
            sessionId:sessionValidation.getSessionKey(req),
            jobType:'BOUNDARY'
        }

        let jobId = `${sessionValidation.getIdentityKey(req)}:boundary-${entryPoint.id}-${entryPoint.type}${Date.now()}`

        let job = await workQueue.add(jobDetails,{jobId});
        res.status(201).json({jobId:job.id});   
        

    } catch (error) {
        next(error);
    }     
}

module.exports = submitBoundaryJob;