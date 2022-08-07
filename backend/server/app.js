let createError = require('http-errors');
let express = require('express');
let path = require('path');
let logger = require('morgan');
let sessionConfig = require('./sessions');
let {handleError} = require('../services/errorHandling');
var enforce = require('express-sslify');
require('dotenv').config();

let app = express();

app.use(sessionConfig);
app.use(logger('dev'));
app.use(express.json());

if(process.env.ENFORCE_SSL == 'true'){
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

app.use((req,res,next) => {

  if(req.hostname == 'sfdc-happy-soup.herokuapp.com'){
    res.redirect(301,'https://happysoup.io');
  }else{
    next();
  }  

});

app.use('/oauth2',require('../routes/oauthRouter'));
app.use('/api',require('../routes/api/router'));

if(process.env.NODE_ENV == 'production'){
  app.use(express.static(path.join(__dirname, '/public'),{extensions: ['html', 'htm']}));

  // Handle SPA
  app.get(/.*/, (req, res) => res.sendFile(__dirname + '/public/index.html'));
}




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  err.statusCode = (err.statusCode || 500);
  if(err.detail){
    console.log(err.detail);
  }

  console.log(err.stack);

  handleError(err,res);

});

module.exports = app;
