let createError = require('http-errors');
let express = require('express');
let path = require('path');
let logger = require('morgan');
let sessionConfig = require('./bin/serverSessions');
let {handleError} = require('./services/errorHandling');
var enforce = require('express-sslify');

let app = express();

app.use(sessionConfig);
app.use(logger('dev'));
app.use(express.json());


//unauthenticated route for oauth login
app.use('/oauth2',require('./routes/oauthRouter'));

//authentication for some public routes
app.use((req,res,next) => {

  console.log('what is the hostname: ',req.hostname);

  let authenticatedPublicRoutes = ['/dependencies.html','/dependencies'];

  if(authenticatedPublicRoutes.indexOf(req.path) != -1 && !req.session.oauthSuccess){
    res.redirect('/?no-session=true');
  }
  else{
    next();
  }  
});

app.use('/api',require('./routes/apiRouter'));
app.use('/identity',require('./routes/identityRouter'));
app.use(express.static(path.join(__dirname, 'public'),{extensions: ['html', 'htm']}));


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
