var session = require('express-session');
const redis = require('redis');
let RedisStore = require('connect-redis')(session);
let redisConfig = require('../db/redisConfig');

let redisClient = redis.createClient(redisConfig.port,redisConfig.host);
if(redisConfig.password){
  redisClient.auth(redisConfig.password);
}

require('dotenv').config();

/**
 * The expire time for both the cookie and the server side session is set to 2 hours. This is because the salesforce connected app
 * is also configured to expire the access token in 2 hours. The idea is that we shouldn't let sessions linger for longer than their
 * actual usable time. 
 * The dependenciesRouter file is anyway configured to destroy the session if the oauth token has expired, but this configuration here
 * (the 2 hours timeout value) is a best effort to keep the server session sort of in sync with the oauth token
 * 
 */
const EXPIRE_TIME = 7200000;

let sessionStore = new RedisStore({
  host: redisConfig.host, 
  port: redisConfig.port, 
  client: redisClient,
  ttl:EXPIRE_TIME,
  disableTouch:true,
  prefix:'sfhs-sess:'
});

let sessionOptions = {
  secret:process.env.SESSION_SECRET,
  cookie:{
    maxAge:EXPIRE_TIME,
    httpOnly: false
  },
  resave:false,
  saveUninitialized:false,//the session is only stored once a change is made to it, which in this case is when the oauth
  //token is attached to it. This stops sessions being created when users just hit the login page but don't actually log in
  store:sessionStore
}

let sessionConfig = session(sessionOptions);

module.exports = {sessionConfig,sessionStore};