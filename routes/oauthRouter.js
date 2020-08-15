const express = require('express');
require('dotenv').config();
let serverSessions = require('../services/serverSessions');
let fetch = require('node-fetch');
let caching = require('../services/caching');
let {ErrorHandler} = require('../services/errorHandling');


const oauthRouter = express.Router();

oauthRouter.route('/callback')

.get(
    async (req,res,next) => {

        if(!req.query.code || !req.query.state){
            res.status(404).send('Authorization code and state parameters are required');
        }
        
        let state = JSON.parse(req.query.state);

        let authEndpoint = `https://${state.environment}.salesforce.com/services/oauth2/token`;
        
        let data = `grant_type=authorization_code&code=${req.query.code}&client_id=${process.env.clientId}&client_secret=${process.env.clientSecret}&redirect_uri=${encodeURIComponent(process.env.redirectURI)}`;

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
                throw new ErrorHandler(404,'oauth-failed','oauth response returned an error');
            }
            else{
                req.session.oauthInfo = json;
                req.session.oauthSuccess = true;
                req.session.cache = caching.initCache();
                res.redirect('/dependencies.html');
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
    serverSessions.validateSessions,
    async (req,res,next) => {
        await serverSessions.logout(req.session);
        res.sendStatus(200);
    }
)

.all(
    (req,res,next) => {
        res.status(403).send(`${req.method} not allowed`);
    }
);

module.exports = oauthRouter;

