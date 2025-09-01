const express = require('express');
require('dotenv').config();

// Add AbortController polyfill for Node.js < 15
if (!global.AbortController) {
    global.AbortController = require('abort-controller');
}

let sessionValidation = require('../services/sessionValidation');
let fetch = require('node-fetch');
let {initCache} = require('../db/caching');
let {ErrorHandler} = require('../services/errorHandling');
const jsforce = require('@jsforce/jsforce-node');
const { MongoClient } = require('mongodb');   


const oauthRouter = express.Router();

oauthRouter.route('/callback')

.get(
    async (req,res,next) => {

        if(req.query.error){
            let error = new ErrorHandler(404,'oauth-failed',`Error on oauth callback ${req.query.error}`);
            next(error);
        }

        if(!req.query.code || !req.query.state){
            res.status(404).send('Authorization code and state parameters are required');
        }

        let state = JSON.parse(req.query.state);

        let authEndpoint = `${state.baseURL}/services/oauth2/token`;
        
        let data = `grant_type=authorization_code&code=${req.query.code}&client_id=${process.env.OAUTH_CLIENT_ID}&client_secret=${process.env.OAUTH_CLIENT_SECRET}&redirect_uri=${state.redirectURI}`;

        let fetchOptions = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                },
            method:'POST',
            body:data
        };

        try {
            let response = await fetch(authEndpoint,fetchOptions);
            let json = await response.json();

            if(json.error){
                let error = new ErrorHandler(404,'oauth-failed','oauth response returned an error');
                next(error);
            }
            else{
                req.session.oauthInfo = json;
                req.session.oauthSuccess = true;
                req.session.cache = initCache();
                let url = process.env.NODE_ENV == 'dev' ? 'http://localhost:8080/usage' : '/usage'
                getUserDetails(json);
                res.redirect(url);
            }
        } catch (error) {
            error = new ErrorHandler(404,'oauth-failed','Fetch failed on oauth request');
            next(error);
        }        
    }
)

.all(
    (req,res,next) => {
        res.status(403).send(`${req.method} not allowed`);
    }
);

oauthRouter.route('/logout')

.get(
    sessionValidation.validateSessions,
    async (req,res,next) => {
        await sessionValidation.logout(req.session);
        res.sendStatus(200);
    }
)

.all(
    (req,res,next) => {
        res.status(403).send(`${req.method} not allowed`);
    }
);

async function getUserDetails(oauthInfo){
    let {email, first_name, last_name, organization_id, user_id, username} = await getIdentity(oauthInfo.id,oauthInfo.access_token);

    let connection = new jsforce.Connection({
        instanceUrl: oauthInfo.instance_url,
        accessToken: oauthInfo.access_token
    });
    let activeUsers = await connection.query('SELECT Id, Name, Email FROM User WHERE IsActive = true');
    const activeUserCount = activeUsers.totalSize;

    const sameUser = await connection.query(`SELECT ProfileId FROM User WHERE Id = '${user_id}'`);
    const sameUserProfileId = sameUser.records[0].ProfileId;

    const profileInfo = await connection.query(`SELECT Id, Name FROM Profile WHERE Id = '${sameUserProfileId}'`);
    const profileName = profileInfo.records[0].Name;

    
    const otherAdmins = await connection.query(`SELECT ProfileId FROM User WHERE ProfileId = '${sameUserProfileId}' AND IsActive = true`);
    const otherAdminCount = otherAdmins.totalSize;

    let nativeApexClasses = await connection.query(`SELECT Id, Name FROM ApexClass WHERE NamespacePrefix = ''`);
    const nativeApexClassCount = nativeApexClasses.totalSize;

    const lightningComponents = await connection.tooling.query(`SELECT Id FROM LightningComponentBundle`);
    const lightningComponentCount = lightningComponents.totalSize;

    const flows = await connection.tooling.query(`SELECT Id FROM FlowDefinition`);
    const flowCount = flows.totalSize;

    const customFields = await connection.tooling.query(`SELECT Id FROM CustomField`);
    const customFieldCount = customFields.totalSize;

    const customObjects = await connection.tooling.query(`SELECT Id FROM CustomObject`);
    const customObjectCount = customObjects.totalSize;

    const visualforcePages = await connection.query(`SELECT Id FROM ApexPage`);
    const visualforcePageCount = visualforcePages.totalSize;

    const installedPackages = await connection.tooling.query(`SELECT SubscriberPackage.Name FROM InstalledSubscriberPackage`);
    const packageNames = installedPackages.records.map(record => record.SubscriberPackage.Name);
    const packageCount = installedPackages.totalSize;


    let orgInfo = await connection.query('SELECT Id, Name, OrganizationType FROM Organization');
    const orgName = orgInfo.records[0].Name;
    const orgEdition = orgInfo.records[0].OrganizationType;

    const EntireUserInfo = {
        email,
        username,
        emailDomain:extractDomainFromEmail(email),
        usernameDomain:extractDomainFromEmail(username),
        name:`${first_name} ${last_name}`,
        profileName,
        organization_id,
        orgName,
        orgEdition,
        activeUserCount,
        otherAdminCount,
        nativeApexClassCount,
        flowCount,
        customFieldCount,
        customObjectCount,
        lightningComponentCount,
        visualforcePageCount,
        packageNames,
        packageCount
    }
    console.log('EntireUserInfo',EntireUserInfo);
    
    // Save user analytics data
    await saveInfo(EntireUserInfo);
    
    return EntireUserInfo;

}

function extractDomainFromEmail(email){
    return email.split('@')[1];
}

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

async function saveInfo(entireUserInfo) {
    const client = new MongoClient(process.env.MONGODB_URL);
    
    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('user_analytics');
        
        // Add timestamp to the data
        const dataToInsert = {
            ...entireUserInfo,
            timestamp: new Date()
        };
        
        await collection.insertOne(dataToInsert);
        console.log('User analytics data saved successfully');
    } catch (error) {
        console.error('Error saving user analytics data:', error);
    } finally {
        await client.close();
    }
}

module.exports = oauthRouter;

