const soapApi = require('../sfdc_apis/soap');
let {ErrorHandler} = require('../services/errorHandling');

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
 * Quick ping to salesforce to see if the oauth token is still alive
 */
async function isSfdcSessionAlive(connection){

    let isAlive = false;

    let api = soapApi(connection);
    let response = await api.getServerTimestamp();

    if(response['soapenv:Envelope']['soapenv:Body'].getServerTimestampResponse){
        isAlive = true;
    }

    return isAlive;
}

function getConnection(session){

    let connection = {
        token: session.oauthInfo.access_token,
        url:session.oauthInfo.instance_url
    }

    return connection;
}

async function logout(session){

    let connection = getConnection(session);
    await soapApi(connection).logout();
    session.destroy();

}

module.exports = {
    validateSessions,
    getConnection,
    logout
}