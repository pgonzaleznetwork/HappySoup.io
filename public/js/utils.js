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

function enableInputField(inputField,mdType){

    inputField.value = '';
    inputField.setAttribute('placeholder',getPlaceHolder(mdType));
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

function createWarning(text,options){

    let textProperty = 'innerText';

    if(options && options.html){
        textProperty = 'innerHTML';
    }
 
    let warningTemplate = document.querySelector('#warning-template');
    let clone = warningTemplate.content.cloneNode(true);
    let warningText = clone.getElementById('warning-template-text');
    warningText[textProperty] = text;
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

function hideChart(){
    let canvasContainer = byId('canvas-container');
    let canvas = byId('stats');
    canvas.innerHTML = '';
    canvasContainer.style.display = 'none';
}

function hideTrees(){
    let dependencyTreePlaceholder = byId('dependency-tree-placeholder');
    let usageTreePlaceholder = byId('usage-tree-placeholder');
    dependencyTreePlaceholder.innerHTML = '';
    usageTreePlaceholder.innerHTML = '';
}

function showProgressBar(){
    let progressBarContainer = byId('progress-bar');
    let progressBar = byId('progress-bar-inner');
    replaceClassWith(progressBarContainer,'invisible-progress-bar','visible-progress-bar');
    replaceClassWith(progressBar,'incomplete-progress-bar','complete-progress-bar');
    
}

function hideProgressBar(){
    let progressBarContainer = byId('progress-bar');
    let progressBar = byId('progress-bar-inner');
    replaceClassWith(progressBarContainer,'visible-progress-bar','invisible-progress-bar');
    replaceClassWith(progressBar,'complete-progress-bar','incomplete-progress-bar');
    
}

function scrollTo(el){
    el.scrollIntoView({behavior:'smooth'});
    
}

function getPlaceHolder(mdType){

    let objectSpecificMetadata = ['Layout','CustomField','ValidationRule','WebLink','FieldSet'];
    if(objectSpecificMetadata.includes(mdType)){
        return 'Start with the object name';
    }
    else{
        return 'Start typing'
    }
}

export const utils = {
    replaceClassWith,
    hideProgressBar,
    showProgressBar,
    hideChart,
    hideTrees,
    scrollTo,
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