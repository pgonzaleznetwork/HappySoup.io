import {utils} from './utils.js'
import {byId} from './utils.js'


window.onload = init();

async function init(){

    let res = await fetch('/api/oauthinfo');
    let json = await res.json();

    let clientId = json;

    let params = new URLSearchParams(location.search);

    if(params.has('logout')){
        document.querySelector('.login-inner').appendChild(utils.createWarning('Your Salesforce session has expired. Please log in again.'));
    }

    if(params.has('oauthfailed')){
        document.querySelector('.login-inner').appendChild(utils.createWarning('We were unable to log into your salesforce org. Try clearing the cache and cookies, using another browser or another org.'));
    }

    /**
     * The very first time the login page is loaded, the no-session parameter
     * will not be on the URL. If the parameter is not there, we immediately
     * redirect the to dependencies page.
     * 
     * The dependencies page however, needs a server side session to be rendered,
     * if there's no session, it'll redirect back to THIS page with the attribute
     * no-session.
     * 
     * So the 2nd time the page is loaded (by the redirect) and the attribute is in the URL
     * we don't redirect the user, and allow them to log in. 
     * 
     * What this whole ping-pong does is to ensure that users cannot use the login page
     * if they are already authenticated. This prevents a single session cookie from
     * being used for 2 different logins/orgs.
     * 
     * If users want to use the login page again, they must use the logout button, which
     * will kill the server side session.
     */
    if(!params.has('no-session')){
        window.location = '/dependencies?session-active=true';
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
        
        let responseType = "code";
        
        let requestURL = `${authEndPoint}?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectURI}&state=${state}`;
        window.location = requestURL;
            
    });
}

