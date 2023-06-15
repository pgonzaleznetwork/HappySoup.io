let config = {};

//this env variable takes precedence because it's always set by
//heroku. Also if we have the URL, we can derive the port and host name
if (process.env.REDIS_URL){

    let redisUrl = require("url").parse(process.env.REDIS_URL);

    config.url = process.env.REDIS_URL;
    config.port = redisUrl.port;
    config.host = redisUrl.hostname
    //the password is only usually provided when running the app on heroku
    config.password = redisUrl.auth.split(":")[1];
    
} 
else if(process.env.REDIS_PORT || process.env.REDIS_HOST){

    config.port = process.env.REDIS_PORT;
    config.host = process.env.REDIS_HOST;
    config.url = `redis://${config.host}:${config.port}`;
}
else{
    config.port = 6379;//default redis port
    config.host = '127.0.0.1';
    config.url = `redis://${config.host}:${config.port}`;
}

config.tls = {
    rejectUnauthorized: false
}

module.exports = config;