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

    byId('environment').addEventListener('change',event => {

        let host = event.target.selectedOptions[0].value;
        let domainInput = byId('domain-input-area');

        if(host === 'domain'){
            domainInput.classList.remove('base-remove');
        }else{
            domainInput.classList.add('base-remove');
        }
    });
  
    byId('login-button').addEventListener('click',() => {

        let host = byId('environment').selectedOptions[0].value;
        let baseURL;

        if(host === 'domain'){

            let domainURL = byId('domain-input').value;

            if(!domainURL){
                alert('Please enter your domain URL');
                return;
            }
            if(domainURL.indexOf('my.salesforce.com') === -1){
                alert(`${domainURL} is not a valid salesforce domain`);
                return;
            }
            if(domainURL.indexOf('https://') != 0){
                alert(`Please use https://`);
                return;
            }
            
            domainURL = domainURL.trim();
            let lastCharacter = domainURL.substr(domainURL.length-1);
            
            //remove last slash
            if(lastCharacter === '/'){
                domainURL = domainURL.substr(0,domainURL.length-1);
            }

            baseURL = domainURL;
        }
        else{
            baseURL = `https://${host}.salesforce.com`;
        }

        let authEndPoint = `${baseURL}/services/oauth2/authorize`;

        let redirectURI = encodeURIComponent(`${window.location.origin}/oauth2/callback`);

        let state = JSON.stringify({
            'baseURL':baseURL,
            'redirectURI':redirectURI
        });
        
        let clientId = "3MVG9I5UQ_0k_hTmZuUMosHPf.2zqzHBqd0j.GMmnThrGhd53n4prfPpHNqSAPRrWzc7Hb0ul.s2m4VYoiWyZ";
        let responseType = "code";
        
        let requestURL = `${authEndPoint}?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectURI}&state=${state}`;
        window.location = requestURL;
            
    });
}

