let {cacheApi} = require('../../../db/caching');
let workQueue = require('../../../db/queueConfig');
let sessionValidation = require('../../../services/sessionValidation');

async function submitListMetadataJob(req,res,next) {

    try{

        let {metadataType} = req.body;
        let cache = cacheApi(req.session.cache);
        let cacheKey = `list-${metadataType}`;

        let cachedData = cache.getMetadataList(cacheKey);

        if(cachedData){
            res.status(202).json(cachedData);
        }
        else{

            let jobDetails = {
                jobType:'LIST_METADATA',
                cacheKey,
                mdtype:metadataType,
                sessionId:sessionValidation.getSessionKey(req)
            };

            let jobId = `${sessionValidation.getIdentityKey(req)}:${cacheKey}${Date.now()}`
            
            let job = await workQueue.add(jobDetails,{jobId});
            res.status(200).json({jobId:job.id});
        }       
    }catch(error){
        next(error);
    }
}

module.exports = submitListMetadataJob;