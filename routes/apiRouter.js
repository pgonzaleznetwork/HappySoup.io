const express = require('express');
const dependencyApi = require('../sfdc_apis/dependencies');
const usageApi = require('../sfdc_apis/usage');
const metadataApi = require('../sfdc_apis/metadata');
const {cacheApi,initCache} = require('../services/caching');
let serverSessions = require('../services/serverSessions');
const parser = require('body-parser');
var cors = require('cors');

var corsOptions = {
    origin: 'http://localhost',
  }

const apiRouter = express.Router();
apiRouter.use(parser.json());


apiRouter.route('/dependencies')


.get(
    cors(corsOptions),
    serverSessions.validateSessions,
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
    async (req,res,next) => {

        try{

            let type = req.query.mdtype;

            let unsupported = (getSupportedMetadataTypes().indexOf(type) == -1);

            if(unsupported){
                let error = new Error();
                let text = 'Unsupported Metadata Type';
                error.name = text;
                error.message = text;
                throw error;
            }

            let cache = cacheApi(req.session.cache);
            let cacheKey = `list-${type}`;

            let cachedData = cache.getMetadataList(cacheKey);

            if(cachedData){
                res.status(202).json(cachedData);
            }
            else{
                let mdapi = metadataApi(serverSessions.getConnection(req.session));
                let results = await mdapi.listMetadata(type);

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

module.exports = apiRouter;