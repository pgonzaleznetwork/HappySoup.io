function replaceClassWith(element, currentClass, newClass) {
    element.classList.remove(currentClass);
    element.classList.add(newClass);
}

function enableButton(el){
    el.disabled = false;
    replaceClassWith(el,'disabled-button','enabled-button');  
}

function disableButton(el){
    el.disabled = true;
    replaceClassWith(el,'enabled-button','disabled-button');  
}

function showLoader(){
    let loader = document.querySelector('.loader');
    loader.style.display = 'block';
}

function hideLoader(){
    let loader = document.querySelector('.loader');
    loader.style.display = 'none';
}

function enableInputField(inputField){

    inputField.value = '';
    inputField.setAttribute('placeholder','Start typing');
    inputField.focus();
    inputField.readOnly = false;
    inputField.classList.remove('disabled-input');
}

function disableInputField(inputField){
    
    inputField.value = 'Loading. This can take a min in large orgs...';
    inputField.readOnly = true;
    inputField.classList.add('disabled-input');
}

function toggleDropdown(dropdown,disabled){
    dropdown.disabled = disabled;
    dropdown.style.cursor = (disabled ? 'not-allowed' : '');
}

function createWarning(text){
 
    let warningTemplate = document.querySelector('#warning-template');
    let clone = warningTemplate.content.cloneNode(true);
    let warningText = clone.getElementById('warning-template-text');
    warningText.innerText = text;
    return clone;
}

function showHelpText(name,type){
    let helpText = byId(`${type}-help`);
    helpText.style.display = 'block';
    let text = byId(`${type}-help-name`);
    text.innerText = name;
}

export function byId(id){
    return document.getElementById(id);
}

function hideHelpText(){

    document.querySelectorAll('.help-text').forEach(helpText => {
        helpText.style.display = 'none';
    })
}

export const utils = {
    replaceClassWith,
    enableButton,
    disableButton,
    showLoader,
    hideLoader,
    toggleDropdown,
    disableInputField,
    enableInputField,
    createWarning,
    showHelpText,
    hideHelpText,
    byId
}