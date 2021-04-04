const {soapAPI} = require('sfdc-happy-api')();
let {ErrorHandler} = require('./errorHandling');
require('dotenv').config();

async function validateSessions(req,res,next){

    try { 
        let serverSessionAlive = (req.session.oauthSuccess || req.session.oauthInfo);

        if(!serverSessionAlive){
            throw new ErrorHandler(404,'session-expired','server session has expired');
        }

        else{

            let sfdcSessionAlive = await isSfdcSessionAlive(getConnection(req.session));
            if(sfdcSessionAlive) next();

            else{
                req.session.destroy();
                throw new ErrorHandler(404,'session-expired','server session was alive but sfdc token was expired');
            }  
        }
    } catch (error) {
        next(error);
    }
}

/**
 * We make sure that the job id matches the identity info (org id + user id) of the logged in user. This prevents
 * users from being able to access job information for jobs submitted by other orgs.
 */
async function validateJobId(req,res,next){

    try {

        //job id format 00D3h000005XLUwEAO.0053h000002JF4cAAG:usage-00N3h00000DdZSIEA3-CustomField1617213923756
        let jobId = req.params.id;
        let identityKeyFromJob = jobId.split(':')[0];

        let identityKey = getIdentityKey(req);

        if(identityKeyFromJob != identityKey){
            throw new ErrorHandler(404,'invalid-job-for-session','The job id does not match the server side session');
        }
        else{
            next();
        }
    } catch (error) {
        next(error); 
    }

}

function getIdentityKey(req){
    return `${req.session.identity.orgId}.${req.session.identity.userId}`;
}


/**
 * Quick ping to salesforce to see if the oauth token is still alive
 */
async function isSfdcSessionAlive(connection){

    let isAlive = false;

    let api = soapAPI(connection);
    let response = await api.getServerTimestamp();

    if(response['soapenv:Envelope']['soapenv:Body'].getServerTimestampResponse){
        isAlive = true;
    }

    return isAlive;
}

function getConnection(session){

    let connection = {
        token: session.oauthInfo.access_token,
        url:session.oauthInfo.instance_url,
        apiVersion:process.env.SFDC_API_VERSION
    }

    return connection;
}

async function logout(session){

    let connection = getConnection(session);
    await soapAPI(connection).logout();
    session.destroy();
}


module.exports = {
    validateSessions,
    getConnection,
    logout,
    getIdentityKey,
    validateJobId
}