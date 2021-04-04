const express = require('express');
let fetch = require('node-fetch');
let {ErrorHandler} = require('../services/errorHandling');
let serverSessions = require('../services/sessionValidation');

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

    let options = getFetchOptions(token);      

    try {

        let res = await fetch(url,options);
        let json = await res.json();

        return json;

    } catch (error) {
        throw new ErrorHandler(404,'no-sfdc-connection','Fetch failed on Identity endpoint');
    }
}

function getFetchOptions(token){
    return {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
    }
}

module.exports = identityRouter;