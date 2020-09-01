const express = require('express');
const dependencyApi = require('../sfdc_apis/dependencies');
const usageApi = require('../sfdc_apis/usage');
const metadataApi = require('../sfdc_apis/metadata');
const {cacheApi,initCache} = require('../services/caching');
let serverSessions = require('../services/serverSessions');
const parser = require('body-parser');
var cors = require('cors');
let {ErrorHandler} = require('../services/errorHandling');

let whitelist = ['http://localhost', 'https://qa-sfdc-happy-soup.herokuapp.com','https://sfdc-happy-soup.herokuapp.com'];

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

            if(cachedData){
                res.status(202).json(cachedData);
            }
            else{

                let connection = serverSessions.getConnection(req.session);

                let api = dependencyApi(connection,entryPoint,cache);
                let response = await api.getDependencies();

                cache.cacheDependency(cacheKey,response);
                res.status(200).json(response);   
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

            let cache = cacheApi(req.session.cache);
            let cacheKey = `usage-${entryPoint.id}`;
          
            let cachedData = cache.getUsage(cacheKey);

            if(cachedData){
                res.status(202).json(cachedData);
            }
            else{

                let connection = serverSessions.getConnection(req.session);

                let api = usageApi(connection,entryPoint,cache);
                let response = await api.getUsage();

                cache.cacheUsage(cacheKey,response);
                res.status(200).json(response);   
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

            let cache = cacheApi(req.session.cache);
            let cacheKey = `list-${req.query.mdtype}`;

            let cachedData = cache.getMetadataList(cacheKey);

            if(cachedData){
                res.status(202).json(cachedData);
            }
            else{
                let mdapi = metadataApi(serverSessions.getConnection(req.session));
                let results = await mdapi.listMetadata(req.query.mdtype);

                results = results.map(r => `${r.fullName}:${r.id}`);
        
                cache.cacheMetadataList(cacheKey,results);
                res.status(202).json(results);
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

function getSupportedMetadataTypes(){
    return [
        'ApexClass','ApexPage','ApexTrigger',
        'ApexComponent','Layout','ValidationRule',
        'WebLink','CustomField','Flow'
    ]
}

function isSupported(type){
    return (getSupportedMetadataTypes().indexOf(type) != -1);
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

module.exports = apiRouter;