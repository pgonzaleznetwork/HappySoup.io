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
  },
  credentials: true // Allow credentials (cookies, sessions) to be sent
}

const apiRouter = express.Router();
apiRouter.use(parser.json());

/********************** /metadata ENDPOINT ****************************************/

apiRouter.route('/metadata')

.options(cors(corsOptions)) // Handle preflight requests

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

/********************** /workflows ENDPOINT ****************************************/

apiRouter.route('/workflows')


.post(
    cors(corsOptions),
    sessionValidation.validateSessions,
    require('./functions/submitWorkflowInfoJob')
)

//any other method on boundaries/ is blocked
.all(
    (req,res,next) => {
        let metadataId = req.params.metadataId;
        res.status(403).send(`${req.method} not allowed on workflows/${metadataId}`);
    }
);

/********************** /usage ENDPOINT ****************************************/

apiRouter.route('/usage')

.options(cors(corsOptions)) // Handle preflight requests

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


/********************** /auth ENDPOINTS ****************************************/

apiRouter.route('/auth/user')

.options(cors(corsOptions)) // Handle preflight requests

.get(
    cors(corsOptions),
    sessionValidation.validateSessions,
    async (req,res,next) => {

        try {
            console.log('[BACKEND] /auth/user endpoint called');
            console.log('[BACKEND] Session exists:', !!req.session);
            console.log('[BACKEND] Session identity exists:', !!req.session.identity);
            console.log('[BACKEND] Session oauthInfo exists:', !!req.session.oauthInfo);

            if(!req.session.identity){
                console.log('[BACKEND] No identity in session, fetching from OAuth...');

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

            // Format response for new UI auth store
            const userResponse = {
                user: {
                    firstName: req.session.identity.name ? req.session.identity.name.split(' ')[0] : '',
                    email: req.session.identity.username,
                    lastLoginUsername: req.session.identity.username,
                    orgId: req.session.identity.orgId,
                    userId: req.session.identity.userId,
                    instanceUrl: req.session.identity.url,
                    environment: req.session.identity.env
                }
            };

            console.log('[BACKEND] Returning user response:', userResponse);
            res.status(200).json(userResponse);

        } catch (error) {
            console.error('[BACKEND] Error in /auth/user:', error);
            next(error);
        } 
    }
)

apiRouter.route('/auth/logout')

.options(cors(corsOptions)) // Handle preflight requests

.post(
    cors(corsOptions),
    sessionValidation.validateSessions,
    async (req,res,next) => {
        try {
            // Clear session
            req.session.destroy((err) => {
                if (err) {
                    return next(err);
                }
                res.clearCookie('connect.sid');
                res.status(200).json({ success: true });
            });
        } catch (error) {
            next(error);
        }
    }
)

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
                refreshToken:req.session.oauthInfo.refresh_token,
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

.options(cors(corsOptions)) // Handle preflight requests

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