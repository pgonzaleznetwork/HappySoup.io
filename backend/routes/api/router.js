let express = require('express');
let {initCache} = require('../../db/caching');
let sessionValidation = require('../../services/sessionValidation');
let parser = require('body-parser');
let cors = require('cors');
let {ErrorHandler} = require('../../services/errorHandling');
let fetch = require('node-fetch');
let {stringify} = require('yaml');


let whitelist = process.env.CORS_DOMAINS.split(',');

let corsOptions = {
  origin: function (origin, callback) {
     
    //if the origin is in the whitelist or if its undefined, which 
    //happens when the API call is made from within the same origin
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error(`${origin} is not configured for CORS. Please make sure that ${origin} is added to the CORS_DOMAIN envrionment variable`));
    }
  }
}

const apiRouter = express.Router();
apiRouter.use(parser.json());

apiRouter.route('/yaml')

.post(
    cors(corsOptions),
    (req,res,next) => {

        let {body} = req;

        let yamlTemplate = require('./ciproviders/github/yamlTemplate.js');
        let steps = require('./ciproviders/github/steps.js');

        let jobName = yamlTemplate.jobs.jobName;

        console.log(body);

        if(body.runPMD){
            jobName.steps.push(steps.installSfdxScanner());
        }

        if(body.jobType == 'validation'){
            jobName.steps.push(steps.deployRunAllTests());
        }

        let file = stringify(yamlTemplate);
        res.status(200).json(file); 
    }
    
)


module.exports = apiRouter;