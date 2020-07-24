import {utils} from './utils.js'

export function handleError(error){

    disableFieldsAndLoaders();

    if(error.message === 'session-expired'){
        window.location = '/?logout=true';
    }

    else if(error.message === 'no-sfdc-connection'){     
        appendWarning('Unable to connect to Salesforce. Please check your internet connection or the status of your org at trust.salesforce.com');     
    }
    else{
        appendWarning(`An error occurred. Please contact the developer of this application and provide the following error: ${error.message}`);
    }
}


function disableFieldsAndLoaders(){

    let inputField = document.getElementById("input-field");

    inputField.value = '';
    inputField.setAttribute('placeholder','');

    utils.hideLoader();
}

function appendWarning(text){

    let topNode = document.getElementById("tree");
    topNode.innerHTML = '';
    topNode.appendChild(utils.createWarning(text));
}