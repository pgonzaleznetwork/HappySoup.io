import {utils} from './utils.js'
import {byId} from './utils.js'

export function handleError(error){

    disableFieldsAndLoaders();

    if(error.message === 'session-expired'){
        window.location = '/?logout=true';
    }

    else if(error.message === 'no-sfdc-connection'){     
        appendWarning(`Unable to connect to Salesforce. Please check your internet connection or the status of your org at trust.salesforce.com
        ${error.stack}`);     
    }
    else{
        appendWarning(`We are sorry, something went wrong. Please click <a style="font-weight: bold" href="https://github.com/pgonzaleznetwork/sfdc-happy-soup/issues/new?title=${error.message}&body=${error.stack}" target="_blank">here</a> to log a Github 
        issue with the following details: ${error.message} 
        ${error.stack}`,{html:true});
    }
}


function disableFieldsAndLoaders(){

    let inputField = byId("input-field");

    inputField.value = '';
    inputField.setAttribute('placeholder','');

    utils.hideLoader();
}

function appendWarning(text,options){

    let dependecyTreePlaceholder = byId("dependency-tree-placeholder");
    let usageTreePlaceholder = byId("usage-tree-placeholder");

    dependecyTreePlaceholder.innerHTML = '';
    usageTreePlaceholder.innerHTML = '';
    
    dependecyTreePlaceholder.appendChild(utils.createWarning(text,options));
}