
import {foldersApi} from './folders.js';
import {autocompleteApi} from './autocompleteLib.js';
import {treeApi} from './tree.js';
import {utils} from './utils.js'
import {byId} from './utils.js';
import {handleError} from './errors.js';

const SFDM = function(){

    function addEvents(){

        let inputField = byId("input-field");
        let queryTypeDropDown = byId('query-type');
        let searchButton = byId('search-button');
        let logoutButton = byId('logout-button');
        let collapseButon = byId('collapse-button');
        let expandButton = byId('expand-button');
        let mdDropDown = byId('md-type-select');
        let packageButton = byId('package-button');
        let dependencyTreePlaceholder = byId('dependency-tree-placeholder');
        let usageTreePlaceholder = byId('usage-tree-placeholder');
        let csvButton = byId('csv-button');
        let excelButton = byId('excel-button');
        let memberIdsByName = new Map();
        let lastApiResponse;
        let selectedMetadataType;

        document.addEventListener('DOMContentLoaded', loadServerInfo);
        logoutButton.onclick = logout;
        collapseButon.onclick = collapseFolders;
        expandButton.onclick = expandFolders;
        mdDropDown.onchange = getMetadataMembers;
        packageButton.onclick = downloadPackageXml;
        searchButton.onclick = doSearch;
        inputField.onkeyup = clickFindButton;
        csvButton.onclick = copyFile;
        excelButton.onclick = copyFile;

        function loadServerInfo(){
            getSupportedMetadataTypes();
            getIdentityInfo();
        }

        async function getIdentityInfo(){

            try {
                let response = await fetch('/identity');
                let json = await response.json();
            
                byId('identity').innerText = `${json.name} (${json.username}) - ${json.env}`;

            } catch {
                //no error handling required because this is not critical to the app functionality
            }
        }

        async function getSupportedMetadataTypes(){

            let url = '/api/supportedtypes';
            let res = await fetch(url);
            let types = await res.json();

            types.forEach(type => {
                let option = document.createElement('option');
                option.value = type;
                option.innerText = type;
                mdDropDown.appendChild(option);
            })
        }

        async function logout(event){

            event.preventDefault();

            await fetch('/oauth2/logout');
            window.location = '/';
        }

        function collapseFolders(){

            document.querySelectorAll('.'+foldersApi.OPEN_FOLDER_CLASS).forEach(folder => {
                foldersApi.collapseFolder(folder);
            });
        }

        function expandFolders(){

            document.querySelectorAll('.'+foldersApi.CLOSED_FOLDER_CLASS).forEach(folder => {
                foldersApi.expandFolder(folder);
            });
        }

        function clickFindButton(event){

            let enterKey = 13;
    
            if (event.keyCode == enterKey) {
                event.preventDefault();
                searchButton.click();
            }
        }

        async function getMetadataMembers(event){

            utils.disableInputField(inputField);
            utils.disableButton(searchButton);

            selectedMetadataType = event.target.value;

            let res = await fetch(`/api/metadata?mdtype=${selectedMetadataType}`);
            let json = await res.json();

            if(json.error){
                handleError(json);
            }

            let members = [];

            json.forEach(r => {
                let [fullName,id] = r.split(':');
                members.push(fullName);
                memberIdsByName.set(fullName,id);
            })
            
            autocompleteApi.autocomplete(inputField, members);

            utils.enableInputField(inputField);
            
        }

        async function doSearch(){

            let selectedMember = inputField.value;
            let selectedQueryType = queryTypeDropDown.value;

            if(selectedMember == ''){
                window.alert('Please select a metadata member');
                return;
            }

            if(selectedQueryType == ''){
                window.alert('Please select a query type');
                return;
            }

            //clear the contents every time a new request is made
            dependencyTreePlaceholder.innerHTML = '';
            usageTreePlaceholder.innerHTML = '';

            utils.hideHelpText();
            utils.disableButton(searchButton);
            utils.showLoader();

            let selectedMemberId = memberIdsByName.get(selectedMember);

            if(selectedQueryType == 'deps'){
                await findDependencies(selectedMember,selectedMemberId,selectedMetadataType);
            }
            else if(selectedQueryType == 'usage'){
                await findUsage(selectedMember,selectedMemberId,selectedMetadataType);
            }
        }

        async function findUsage(selectedMember,selectedMemberId,selectedMetadataType){

            let url = `api/usage?name=${selectedMember}&id=${selectedMemberId}&type=${selectedMetadataType}`;

            let response = await fetch(url);
            response = await response.json();
            
            if(response.error) handleError (response);

            else{

                console.log(response);
                
                utils.hideLoader();

                let isEmpty = (Object.keys(response.usageTree).length === 0);
                
                //if the response contains results
                if(!isEmpty){
                    treeApi.createUsageTree(response.usageTree,usageTreePlaceholder);
                    utils.showHelpText(response.entryPoint.name,'usage');
                    lastApiResponse = response;
                }
                else{
                    usageTreePlaceholder.appendChild(utils.createWarning('No results. Either this metadata is not referenced/used by any other metadata or it is part of a managed package, in which case we are unable to see its dependencies.'));
                }
    
                utils.enableButton(searchButton);
            }
        }

        async function findDependencies(selectedMember,selectedMemberId,selectedMetadataType){


            let url = `api/dependencies?name=${selectedMember}&id=${selectedMemberId}&type=${selectedMetadataType}`;

            let response = await fetch(url);
            response = await response.json();
            
            if(response.error) handleError (response);

            else{

                utils.hideLoader();

               let isEmpty = (Object.keys(response.dependencyTree).length === 0);
                
                //if the response contains results
                if(!isEmpty){
                    treeApi.createDependencyTree(response.dependencyTree,dependencyTreePlaceholder);
                    utils.showHelpText(response.entryPoint.name,'deps');
                    lastApiResponse = response;
                }
                else{
                    dependencyTreePlaceholder.appendChild(utils.createWarning('No results. Either this metadata does not reference any other metadata or it is part of a managed package, in which case we are unable to see its dependencies.'));
                }
    
                utils.enableButton(searchButton);
            }
        }



        function copyFile(event){

            let format = event.target.dataset.format;

            if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                var textarea = document.createElement('textarea');
                textarea.textContent = lastApiResponse[format];
                textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    return document.execCommand("copy");  // Security exception may be thrown by some browsers.
                }
                catch (ex) {
                    console.warn("Copy to clipboard failed.", ex);
                    return false;
                }
                finally {
                    document.body.removeChild(textarea);
                }
            }
        }


        function downloadPackageXml(){

            //need to validate if the last api response was valid

            let hiddenLink = document.createElement('a');
            hiddenLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(lastApiResponse.packageXml));
            hiddenLink.setAttribute('download', `${lastApiResponse.entryPoint.name}-package.xml`);            
            hiddenLink.style.display = 'none';

            document.body.appendChild(hiddenLink);
            hiddenLink.click();
            document.body.removeChild(hiddenLink); 
        }
    }

    return { addEvents}


}();


SFDM.addEvents();

