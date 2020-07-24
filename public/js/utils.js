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

function enableInputField(el){
    el.readOnly = false;
    el.classList.remove('disabled-input');
}

function disableInputField(el){
    el.readOnly = true;
    el.classList.add('disabled-input');
}

function createWarning(text){
 
    let warningTemplate = document.querySelector('#warning-template');
    let clone = warningTemplate.content.cloneNode(true);
    let warningText = clone.getElementById('warning-template-text');
    warningText.innerText = text;
    return clone;
}

function showHelpText(name){
    let helpText = document.getElementById('ref-help');
    helpText.style.display = 'block';
    let text = document.getElementById('ref-help-name');
    text.innerText = name;
}

function hideHelpText(){
    let helpText = document.getElementById('ref-help');
    helpText.style.display = 'none';
}

export const utils = {
    replaceClassWith,
    enableButton,
    disableButton,
    showLoader,
    hideLoader,
    disableInputField,
    enableInputField,
    createWarning,
    showHelpText,
    hideHelpText
}