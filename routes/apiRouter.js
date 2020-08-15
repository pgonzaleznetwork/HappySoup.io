const express = require('express');
const dependencyApi = require('../sfdc_apis/dependencies');
const soapApi = require('../sfdc_apis/soap');
const metadataApi = require('../sfdc_apis/metadata');
const {cacheApi} = require('../services/caching');
let serverSessions = require('../services/serverSessions');
const parser = require('body-parser');
var cors = require('cors');

var corsOptions = {
    origin: 'http://localhost',
  }

const apiRouter = express.Router();
apiRouter.use(parser.json());


apiRouter.route('/dependencies')


.all(
    (req,res,next) => {
        res.status(403).send(`${req.method} not allowed on dependencies/`);
    }
);

apiRouter.route('/dependencies/:metadataId')


.get(
    cors(corsOptions),
    serverSessions.validateSessions,
    async (req,res,next) => {

        try {

            let cache = cacheApi(req.session.cache);
            let cacheKey = `deps-${req.params.metadataId}`;
            
            let cachedData = cache.getDependency(cacheKey);

            if(cachedData){
                res.status(202).json(cachedData);
            }
            else{

                let connection = serverSessions.getConnection(req.session);

                let api = dependencyApi(connection,req.params.metadataId,cache);
                let response = await api.getDependencies();

                cache.cacheDependency(cacheKey,response);
                res.status(200).json(response);   
            }
        } catch (error) {
            next(error);
        }     
    }
)

//any other method on dependencies/:metadataId is blocked
.all(
    (req,res,next) => {
        let metadataId = req.params.metadataId;
        res.status(403).send(`${req.method} not allowed on dependencies/${metadataId}`);
    }
);

apiRouter.route('/metadata')

.get(
    cors(corsOptions),
    serverSessions.validateSessions,
    async (req,res,next) => {

        try{

            let cache = cacheApi(req.session.cache);
            let cacheKey = `list-${req.query.mdtype}`;

            let cachedData = cache.getMetadataList(cacheKey);

            if(cachedData){
                console.log('retrieving metadata list from cache');
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

apiRouter.route('/cache')

.delete(
    cors(corsOptions),
    serverSessions.validateSessions,
    async (req,res,next) => {
        //NEED TO READ ABOUT GC
        req.session.cache = {};
        res.sendStatus(200);
    }
);

module.exports = apiRouter;