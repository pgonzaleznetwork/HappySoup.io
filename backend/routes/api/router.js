let express = require('express');
let {initCache} = require('../../db/caching');
let sessionValidation = require('../../services/sessionValidation');
let parser = require('body-parser');
let cors = require('cors');
let {ErrorHandler} = require('../../services/errorHandling');
let fetch = require('node-fetch');

let whitelist = process.env.CORS_DOMAINS.split(',');

let corsOptions = {
  origin: function (origin, callback) {
     
    //if the origin is in the whitelist or if its undefined, which 
    //happens when the API call is made from within the same origin
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error(`${origin} is not configured for CORS. Please make sure that ${origin} is added to the CORS_DOMAIN envrionment variable`));
    }
  }
}

const apiRouter = express.Router();
apiRouter.use(parser.json());

/********************** /metadata ENDPOINT ****************************************/

apiRouter.route('/metadata')

.get(
    cors(corsOptions),
    (req,res,next) => {
        let types = require('./functions/getMetadataTypes')();
        res.status(200).json(types);  
    }
)

.post(
    cors(corsOptions),
    sessionValidation.validateSessions,
    require('./functions/submitListMetadataJob')
);


/********************** /boundaries ENDPOINT ****************************************/

apiRouter.route('/boundaries')


.post(
    cors(corsOptions),
    sessionValidation.validateSessions,
    require('./functions/submitBoundaryJob')
)

//any other method on boundaries/ is blocked
.all(
    (req,res,next) => {
        let metadataId = req.params.metadataId;
        res.status(403).send(`${req.method} not allowed on dependencies/${metadataId}`);
    }
);

/********************** /usage ENDPOINT ****************************************/

apiRouter.route('/usage')

.post(
    cors(corsOptions),
    sessionValidation.validateSessions,
    require('./functions/submitUsageJob')
)

//any other method on usage/:metadataId is blocked
.all(
    (req,res,next) => {
        let metadataId = req.params.metadataId;
        res.status(403).send(`${req.method} not allowed on usage/${metadataId}`);
    }
);

/********************** /bulkusage ENDPOINT ****************************************/

apiRouter.route('/bulkusage')

.post(
    cors(corsOptions),
    sessionValidation.validateSessions,
    require('./functions/submitBulkUsageJob')
)

/********************** /cache ENDPOINT ****************************************/

apiRouter.route('/cache')

.delete(
    cors(corsOptions),
    sessionValidation.validateSessions,
    async (req,res,next) => {
        //NEED TO READ ABOUT GC
        req.session.cache = initCache();
        res.sendStatus(200);
    }
);

/********************** /oauthinfo ENDPOINT ****************************************/

apiRouter.route('/oauthinfo/clientid')

.get(
    cors(corsOptions),
    async (req,res,next) => {
        res.status(200).json(process.env.OAUTH_CLIENT_ID);
    }
);


/********************** /identity ENDPOINT ****************************************/

apiRouter.route('/identity')

.get(
    cors(corsOptions),
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
                    url:oauthInfo.instance_url,
                    env
                }
            }

            res.status(200).json(req.session.identity);

        } catch (error) {
            next(error);
        } 
    }
)

/********************** /session ENDPOINT ****************************************/

apiRouter.route('/session')

.get(
    cors(corsOptions),
    sessionValidation.validateSessions,
    async (req,res,next) => {

        try {

            let data = {
                token:req.session.oauthInfo.access_token,
                url:req.session.oauthInfo.instance_url
            }

            res.status(200).json(data);

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
    require('./functions/getJobStatus')
)



function isSupported(type){

    let supportedTypes = require('./functions/getMetadataTypes')().map(type => type.value);

    return (supportedTypes.indexOf(type) != -1);
}



module.exports = apiRouter;