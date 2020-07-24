import {utils} from './utils.js'

const OPEN_FOLDER_CLASS = 'fa-folder-open';
const CLOSED_FOLDER_CLASS = 'fa-folder';

function createFolderIcon(){

    let folderIcon = document.createElement('i');
    folderIcon.classList.add('fa','fa-folder-open');
  
    folderIcon.addEventListener('click',() => {
        expandOrCollapse(folderIcon);
    });
  
    return folderIcon;
  
}

function expandOrCollapse(folder) {

    let collapsed = folder.classList.contains(CLOSED_FOLDER_CLASS);
    let expanded = folder.classList.contains(OPEN_FOLDER_CLASS);

    if (collapsed) expandFolder(folder);
    else if (expanded) collapseFolder(folder);

}
  
function collapseFolder(folder) {
    utils.replaceClassWith(folder, OPEN_FOLDER_CLASS, CLOSED_FOLDER_CLASS);
    hideChildren(folder);
}
  
function expandFolder(folder) {
    utils.replaceClassWith(folder, CLOSED_FOLDER_CLASS, OPEN_FOLDER_CLASS);
    showChildren(folder);
}
  
function hideChildren(folder) {

    let parentListItem = folder.parentElement;
    let listItems = Array.from(parentListItem.children);

    listItems.forEach((li) => {

        if (li.tagName == "UL" || li.tagName == "LI") {
        li.style.display = "none";
        }
    });
}

function showChildren(folder) {

    let parentListItem = folder.parentElement;
    let listItems = Array.from(parentListItem.children);

    listItems.forEach((li) => {

        if (li.tagName == "LI") {
        li.style.display = "list-item";
        } 
        else if (li.tagName == "UL") {
        li.style.display = "";
        }
    });
}

export const foldersApi = {
    createFolderIcon,
    expandFolder,
    collapseFolder,
    OPEN_FOLDER_CLASS,
    CLOSED_FOLDER_CLASS
};