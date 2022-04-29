let workQueue = require('../../../db/queue/queueConfig');
let sessionValidation = require('../../../services/sessionValidation');

async function submitWorkflowInfoJob(req,res,next) {

    try {

        let {entryPoint} = req.body;

        let jobDetails = {
            entryPoint,
            sessionId:sessionValidation.getSessionKey(req),
            jobType:'WORKFLOW_INFO'
        }

        let jobId = `${sessionValidation.getIdentityKey(req)}:workflow-info-${entryPoint.id}-${entryPoint.type}${Date.now()}`

        let job = await workQueue.add(jobDetails,{jobId});
        res.status(201).json({jobId:job.id});   
        

    } catch (error) {
        next(error);
    }     
}

module.exports = submitWorkflowInfoJob;