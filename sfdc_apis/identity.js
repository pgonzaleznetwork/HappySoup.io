let fetch = require('node-fetch');
let {ErrorHandler} = require('../services/errorHandling');

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

module.exports = getIdentity;