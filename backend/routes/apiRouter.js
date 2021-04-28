let express = require('express');
let {cacheApi,initCache} = require('../db/caching');
let sessionValidation = require('../services/sessionValidation');
let parser = require('body-parser');
let cors = require('cors');
let {ErrorHandler} = require('../services/errorHandling');
let logError = require('../services/logging');
let Queue = require('bull');
let {url} = require('../db/redisConfig');
const QUEUE_NAME = 'happy-soup';
let workQueue = new Queue(QUEUE_NAME, url);
let redisOps = require('../db/redisOps');
let fetch = require('node-fetch');

let whitelist = process.env.CORS_DOMAINS.split(',');

let corsOptions = {
  origin: function (origin, callback) {
    //if the origin is in the whitelist or if its undefined, which 
    //happens when the API call is made from within the same origin
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

const apiRouter = express.Router();
apiRouter.use(parser.json());


apiRouter.route('/dependencies')


.get(
    cors(corsOptions),
    sessionValidation.validateSessions,
    validateParams,
    async (req,res,next) => {

        try {

            let entryPoint = {...req.query};

            let jobDetails = {
                entryPoint,
                sessionId:getSessionKey(req),
                jobType:'DEPENDENCIES'
            }

            let jobId = `${sessionValidation.getIdentityKey(req)}:deps-${entryPoint.id}-${entryPoint.type}${Date.now()}`
    
            let job = await workQueue.add(jobDetails,{jobId});
            res.status(200).json({jobId:job.id});   
            

        } catch (error) {
            next(error);
        }     
    }
)

//any other method on dependencies/ is blocked
.all(
    (req,res,next) => {
        let metadataId = req.params.metadataId;
        res.status(403).send(`${req.method} not allowed on dependencies/${metadataId}`);
    }
);

apiRouter.route('/usage')


.get(
    cors(corsOptions),
    sessionValidation.validateSessions,
    validateParams,
    async (req,res,next) => {

        try {

            let entryPoint = {...req.query};
            entryPoint.options = JSON.parse(entryPoint.options);

            let jobDetails = {
                entryPoint,
                sessionId:getSessionKey(req),
                jobType:'USAGE'
            }

            let jobId = `${sessionValidation.getIdentityKey(req)}:usage-${entryPoint.id}-${entryPoint.type}${Date.now()}`

            let job = await workQueue.add(jobDetails,{jobId});
            res.status(200).json({jobId:job.id});   

            
        } catch (error) {
            next(error);
        }     
    }
)

//any other method on usage/:metadataId is blocked
.all(
    (req,res,next) => {
        let metadataId = req.params.metadataId;
        res.status(403).send(`${req.method} not allowed on usage/${metadataId}`);
    }
);

apiRouter.route('/metadata')

.get(
    cors(corsOptions),
    sessionValidation.validateSessions,
    validateParams,
    async (req,res,next) => {

        try{

            let {mdtype} = req.query;
            let cache = cacheApi(req.session.cache);
            let cacheKey = `list-${mdtype}`;

            let cachedData = cache.getMetadataList(cacheKey);

            if(cachedData){
                res.status(202).json(cachedData);
            }
            else{

                let jobDetails = {
                    jobType:'LIST_METADATA',
                    cacheKey,
                    mdtype,
                    sessionId:getSessionKey(req)
                };

                let jobId = `${sessionValidation.getIdentityKey(req)}:${cacheKey}${Date.now()}`
                
                let job = await workQueue.add(jobDetails,{jobId});
                res.status(200).json({jobId:job.id});
            }       
        }catch(error){
            next(error);
        }
    }
);

/**
 * This endpoint doesn't require a server or sf session because it simply returns
 * an array of supported types. Also, these types need to be available to the client ASAP
 * so validating the session with salesforce would delay the response.
 */
apiRouter.route('/supportedtypes')

.get(
    cors(corsOptions),
    (req,res,next) => {
        let types = getSupportedMetadataTypes();
        res.status(200).json(types);  
    }
);

apiRouter.route('/deletecache')

.get(
    cors(corsOptions),
    sessionValidation.validateSessions,
    async (req,res,next) => {
        //NEED TO READ ABOUT GC
        req.session.cache = initCache();
        res.sendStatus(200);
    }
);

apiRouter.route('/oauthinfo/clientid')

.get(
    cors(corsOptions),
    async (req,res,next) => {
        res.status(200).json(process.env.OAUTH_CLIENT_ID);
    }
);

apiRouter.route('/oauthinfo/instanceurl')

.get(
    cors(corsOptions),
    sessionValidation.validateSessions,
    async (req,res,next) => {
        res.status(200).json(req.session.oauthInfo.instance_url);
    }
);

apiRouter.route('/identity')

.get(
    sessionValidation.validateSessions,
    async (req,res,next) => {

        try {

            if(!req.session.identity){

                let oauthInfo = req.session.oauthInfo;

                let json = await getIdentity(oauthInfo.id,oauthInfo.access_token);

                let env = oauthInfo.id.includes('test.salesforce.com') ? 'Sandbox' : 'Production';
    
                req.session.identity = {
                    username:json.username,
                    name:json.display_name,
                    orgId:json.organization_id,
                    userId:json.user_id,
                    env
                }
            }

            res.status(200).json(req.session.identity);

        } catch (error) {
            next(error);
        } 
    }
)

async function getIdentity(url,token){

    let options = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
    }     

    try {

        let res = await fetch(url,options);
        let json = await res.json();

        return json;

    } catch (error) {
        throw new ErrorHandler(404,'no-sfdc-connection','Fetch failed on Identity endpoint '+error);
    }
}

apiRouter.route('/job/:id')

.get(
    cors(corsOptions),
    sessionValidation.validateJobId,
    sessionValidation.validateSessions,
    async (req,res,next) => {
    
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

})



function getSupportedMetadataTypes(){

    let defaultDeploymentBoundaryLabel = 'What it depends on / Deployment Boundary';
    let defaultImpactAnalysisLabel = 'Where is this used / Impact Analysis';

    let defaultSupportedQueries = [
        {
            type:'usage',
            label:defaultImpactAnalysisLabel
        },
        {
            type:'deps',
            label:defaultDeploymentBoundaryLabel
        }
        
    ];

    return [

        {
            "label":"Custom Field",
            "value":"CustomField",
            supportedQueries : [
                {
                    type:'deps',
                    label:'Fields referenced by this field / Deployment Boundary'
                },
                {
                    type:'usage',
                    label:defaultImpactAnalysisLabel
                },
            ]
         },
         {
            "label":"Standard Field",
            "value":"StandardField",
            supportedQueries : [
                {
                    type:'usage',
                    label:defaultImpactAnalysisLabel
                },
            ]
         },

         {
            "label":"Custom Object/Setting/Metadata Type",
            "value":"CustomObject",
            supportedQueries : [
                {
                    type:'usage',
                    label:'Where is this used / Impact Analysis'
                },
            ]
         },
         {
            "label":"Standard Objects",
            "value":"CustomObject",
            supportedQueries : [
                {
                    type:'usage',
                    label:'Where is this used / Impact Analysis'
                },
            ]
         },

        {
            "label":"Page Layout",
            "value":"Layout",
            supportedQueries : [
                {
                    type:'deps',
                    label:'Fields used in layout / Deployment Boundary'
                }
            ]
         },
         
        {
            "label":"Custom Button",
            "value":"WebLink",
            supportedQueries : [
                {
                    type:'usage',
                    label:'Layouts using this button / Impact Analysis'
                },
            ]
         },
         
         {
            "label":"Field Set",
            "value":"FieldSet",
            supportedQueries : defaultSupportedQueries
         },

        {
            "label":"Apex Trigger",
            "value":"ApexTrigger",
            supportedQueries : [
                {
                    type:'deps',
                    label:defaultDeploymentBoundaryLabel
                }
            ]
        },

        {
            label:'Apex Class',
            value:'ApexClass',
            supportedQueries : defaultSupportedQueries
        },
        {
            "label":"Visualforce Page",
            "value":"ApexPage",
            supportedQueries : defaultSupportedQueries
         },
         {
            "label":"Visualforce Component",
            "value":"ApexComponent",
            supportedQueries : defaultSupportedQueries
         },
         
         {
            "label":"Custom Label",
            "value":"CustomLabel",
            supportedQueries : [
                {
                    type:'usage',
                    label:defaultImpactAnalysisLabel
                }
            ]
         },
         {
            "label":"Validation Rule",
            "value":"ValidationRule",
            supportedQueries : [
                {
                    type:'deps',
                    label:'Fields used in validation rule / Deployment Boundary'
                }
            ]
         },
         {
            "label":"Flow / Process",
            "value":"Flow",
            supportedQueries : defaultSupportedQueries
         },
         {
            "label":"Email Template",
            "value":"EmailTemplate",
            supportedQueries : defaultSupportedQueries
         },
         {
            "label":"Email Alert",
            "value":"WorkflowAlert",
            supportedQueries : defaultSupportedQueries
         },
         {
            "label":"Lightning Component (Aura)",
            "value":"AuraDefinitionBundle",
            supportedQueries : defaultSupportedQueries
         }
    ];
}

function isSupported(type){

    let supportedTypes = getSupportedMetadataTypes().map(type => type.value);

    return (supportedTypes.indexOf(type) != -1);
}


function validateParams(req,res,next){

    let path = req.path;

    if(path == '/usage' || path == '/dependencies'){

        let {name,id,type} = req.query;

        if(!name || !id || !type){
            throw new ErrorHandler(404,'Invalid parameters','Invalid parameters on dependency API');
        }else{
            if(!isSupported(type)){
                throw new ErrorHandler(404,'Unsupported type','Unsupported type on dependency API');
            }
            if(name === ''){
                throw new ErrorHandler(404,'Invalid name','Invalid name on dependency API');
            }
        }
    }

    if(path == '/metadata'){

        let type = req.query.mdtype;

        if(!isSupported(type)){
            throw new ErrorHandler(404,'Unsupported type','Unsupported type on dependency API');
        }
    }

    next();

}

function deleteJobInfo(jobId){
    //redis key format -- bull:happy-soup:pgonzalez@test.com.uat:list-ApexClass1602182549998
    let redisKey = `bull:${QUEUE_NAME}:${jobId}`;
    redisOps.redisDel(redisKey);
}

function getSessionKey(req){
    return `sfhs-sess:${req.sessionID}`;
}

module.exports = apiRouter;