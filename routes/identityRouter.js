const express = require('express');
let getIdentity = require('../sfdc_apis/identity');
let serverSessions = require('../services/serverSessions');


const identityRouter = express.Router();

identityRouter.route('/')

.get(
    serverSessions.validateSessions,
    async (req,res,next) => {

        try {

            if(!req.session.identity){

                let oauthInfo = req.session.oauthInfo;

                let json = await getIdentity(oauthInfo.id,oauthInfo.access_token);
    
                let env = oauthInfo.id.includes('test.salesforce.com') ? 'Sandbox' : 'Production';
    
                req.session.identity = {
                    username:json.username,
                    name:json.display_name,
                    env
                }
            }

            res.status(200).json(req.session.identity);

        } catch (error) {
            next(error);
        } 
    }
)

module.exports = identityRouter;