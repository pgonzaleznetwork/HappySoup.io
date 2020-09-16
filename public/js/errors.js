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
        appendWarning(`An error occurred. Please contact the developer of this application and provide the following error: ${error.message} 
        ${error.stack}`);
    }
}


function disableFieldsAndLoaders(){

    let inputField = byId("input-field");

    inputField.value = '';
    inputField.setAttribute('placeholder','');

    utils.hideLoader();
}

function appendWarning(text){

    let dependecyTreePlaceholder = byId("dependency-tree-placeholder");
    let usageTreePlaceholder = byId("usage-tree-placeholder");

    dependecyTreePlaceholder.innerHTML = '';
    usageTreePlaceholder.innerHTML = '';
    
    dependecyTreePlaceholder.appendChild(utils.createWarning(text));
}