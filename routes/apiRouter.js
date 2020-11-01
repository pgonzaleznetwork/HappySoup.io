let express = require('express');
let {cacheApi,initCache} = require('../services/caching');
let serverSessions = require('../services/serverSessions');
let parser = require('body-parser');
let cors = require('cors');
let {ErrorHandler} = require('../services/errorHandling');
let Queue = require('bull');
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const QUEUE_NAME = 'happy-soup';
let workQueue = new Queue(QUEUE_NAME, REDIS_URL);
let redisOps = require('../services/redisOps');

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
    serverSessions.validateSessions,
    validateParams,
    async (req,res,next) => {

        try {

            let entryPoint = {...req.query};

            let cacheKey = `deps-${entryPoint.id}`;
            
            let cache = cacheApi(req.session.cache);
            let cachedData = cache.getDependency(cacheKey);

            if(cachedData) res.status(202).json(cachedData);

            else{

                let jobDetails = {
                    cacheKey,
                    entryPoint,
                    sessionId:getSessionKey(req),
                    jobType:'DEPENDENCIES'
                }

                let jobId = `${req.session.identity.username}:${cacheKey}${Date.now()}`
      
                let job = await workQueue.add(jobDetails,{jobId});
                res.status(200).json({jobId:job.id});   
            }

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
    serverSessions.validateSessions,
    validateParams,
    async (req,res,next) => {

        try {

            let entryPoint = {...req.query};
            entryPoint.options = JSON.parse(entryPoint.options);

            //a job to get the usage of a metadata item is different
            //if the client passed options on the job
            //therefore we create a string concatenating all the options
            //that were passed as true
            //this way if the job is submitted again but with one option set
            //to false, we don't return the previously cached response but instead
            //create a brand new job with a unique key
            let optionsString = '';

            for (const property in entryPoint.options) {
                if(entryPoint.options[property] == true){
                    optionsString += property;
                }
            }

            let cache = cacheApi(req.session.cache);
            let cacheKey = `usage-${entryPoint.id}${optionsString}`;
          
            let cachedData = cache.getUsage(cacheKey);

            if(cachedData) res.status(202).json(cachedData);
            
            else{

                let jobDetails = {
                    cacheKey,
                    entryPoint,
                    sessionId:getSessionKey(req),
                    jobType:'USAGE'
                }

                let jobId = `${req.session.identity.username}:${cacheKey}${Date.now()}`

                let job = await workQueue.add(jobDetails,{jobId});
                res.status(200).json({jobId:job.id});   
 
            }
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
    serverSessions.validateSessions,
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

                let jobId = `${req.session.identity.username}:${cacheKey}${Date.now()}`
                
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
    serverSessions.validateSessions,
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
    serverSessions.validateSessions,
    async (req,res,next) => {
        res.status(200).json(req.session.oauthInfo.instance_url);
    }
);

apiRouter.route('/job/:id')

.get(
    cors(corsOptions),
    serverSessions.validateSessions,
    async (req,res,next) => {
    
    let jobId = req.params.id;
    let job = await workQueue.getJob(jobId);
    
    if (job === null) {
        res.status(404).end();
    } else {

        let response = {};

        response.jobId = jobId;
        response.state = await job.getState();

        if(response.state == 'completed'){
            let jobResult = job.returnvalue;
            req.session.cache = jobResult.newCache;
            setTimeout(deleteJobInfo,30000,jobId);
        }
        
        if(job.failedReason){
            response.error = {};
            response.error.message = job.failedReason;
            response.error.stack = job.stacktrace[0];
        }

        res.status(200).json(response);
    }

})



function getSupportedMetadataTypes(){

    return [
        {label:'Apex Class',value:'ApexClass'},
        {label:'Visualforce Page',value:'ApexPage'},
        {label:'Visualforce Component',value:'ApexComponent'},
        {label:'Apex Trigger',value:'ApexTrigger'},
        {label:'Page Layout',value:'Layout'},
        {label:'Custom Button',value:'WebLink'},
        {label:'Custom Field',value:'CustomField'},
        {label:'Field Set',value:'FieldSet'},
        {label:'Custom Label',value:'CustomLabel'},
        {label:'Validation Rule',value:'ValidationRule'},
        {label:'Flow / Process',value:'Flow'},
        {label:'Email Template',value:'EmailTemplate'},
        {label:'Lightning Component (Aura)',value:'AuraDefinitionBundle'},
        {label:'Lightning Web Component',value:'LightningComponentBundle'}
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
            if(id.length != 18){
                throw new ErrorHandler(404,'Invalid Id length','Invalid Id length on dependency API');
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
    //bull:happy-soup:pgonzalez@test.com.uat:list-ApexClass1602182549998
    let redisKey = `bull:${QUEUE_NAME}:${jobId}`;
    redisOps.redisDel(redisKey);
}

function getSessionKey(req){
    return `sfhs-sess:${req.sessionID}`;
}

module.exports = apiRouter;