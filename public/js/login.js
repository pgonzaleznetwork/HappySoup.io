import {utils} from './utils.js'
import {byId} from './utils.js'


window.onload = init();

function init(){

    let params = new URLSearchParams(location.search);

    if(params.has('logout')){
        document.querySelector('.login-inner').appendChild(utils.createWarning('Your Salesforce session has expired. Please log in again.'));
    }

    if(params.has('oauthfailed')){
        document.querySelector('.login-inner').appendChild(utils.createWarning('We were unable to log into your salesforce org. Try clearing the cache and cookies, using another browser or another org.'));
    }
  
    byId('login-button').addEventListener('click',() => {

        let host = byId('environment').selectedOptions[0].value;
        let authEndPoint = `https://${host}.salesforce.com/services/oauth2/authorize`;

        let state = JSON.stringify({'environment':host});
        let clientId = "3MVG9I5UQ_0k_hTmZuUMosHPf.2zqzHBqd0j.GMmnThrGhd53n4prfPpHNqSAPRrWzc7Hb0ul.s2m4VYoiWyZ";
        let responseType = "code";
        let redirectURI = encodeURIComponent(`${window.location.origin}/oauth2/callback`);
        let requestURL = `${authEndPoint}?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectURI}&state=${state}`;
        window.location = requestURL;
            
    });
}

