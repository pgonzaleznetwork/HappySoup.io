
import {foldersApi} from './folders.js';
import {autocompleteApi} from './autocompleteLib.js';
import {treeApi} from './tree.js';
import {utils} from './utils.js'
import {handleError} from './errors.js';


const SFDM = function(){

    function addEvents(){

        //variables shared among some of the functions below
        let inputField = document.getElementById("input-field");
        let findButton = document.getElementById('find-button');
        let memberIdsByName = new Map();
        let dependenciesResponse;

        window.onload = async () => {

            let response = await fetch('http://localhost:3000/identity');
            let json = await response.json();
            
            document.getElementById('identity').innerText = `${json.name} (${json.username}) - ${json.env}`;
        }

        document.getElementById('logout-button').addEventListener('click', async (event) => {

            event.preventDefault();

            await fetch('/oauth2/logout');
            window.location = '/';

        })
        
        document.getElementById('collapse-button').addEventListener('click',() => {
    
            document.querySelectorAll('.'+foldersApi.OPEN_FOLDER_CLASS).forEach(folder => {
                foldersApi.collapseFolder(folder);
            });
        });
    
        document.getElementById('expand-button').addEventListener('click',()=> {
    
            document.querySelectorAll('.'+foldersApi.CLOSED_FOLDER_CLASS).forEach(folder => {
                foldersApi.expandFolder(folder);
            });
        });
    
        inputField.addEventListener('keyup',event => {
            
            let enterKey = 13;
    
            if (event.keyCode == enterKey) {
                event.preventDefault();
                findButton.click();
            }
        });

        document.getElementById('md-type-select').addEventListener('change', async event => {

            let cacheKey = `list-${event.target.value}`;

            inputField.value = 'Loading...';
            utils.disableInputField(inputField);
            utils.disableButton(findButton);


            let res = await fetch(`/api/metadata?mdtype=${event.target.value}`);
            let json = await res.json();

            if(json.error){
                handleError(json);
            }

            //the response should be cached using localStorage

            /*let json;

            if(!localStorage.getItem(cacheKey)){

                let res = await fetch(`/api/metadata?mdtype=${event.target.value}`);
                json = await res.json();

                if(json.error){
                    handleError(json);
                }
                else{
                    localStorage.setItem(cacheKey,JSON.stringify(json));
                }
            }            

            else{
   
                json = JSON.parse(localStorage.getItem(cacheKey));
                console.log('retrieved from cache');   
            }        */
            
            let members = json.map(r => r.fullName);
            json.forEach(r => memberIdsByName.set(r.fullName,r.id));
            autocompleteApi.autocomplete(inputField, members);

            utils.enableInputField(inputField);
            inputField.value = '';
            inputField.setAttribute('placeholder','Start typing');
            inputField.focus();
        });

        
        findButton.addEventListener('click',async event => {

            if(inputField.value == ''){
                window.alert('Please select a metadata member');
                return;
            }

            //clear the contents every time a new request is madee
            document.getElementById("tree").innerHTML = "";
            utils.hideHelpText();
            
            utils.disableButton(findButton);
            utils.showLoader();

            let selectedMember = inputField.value;
            let selectedMemberId = memberIdsByName.get(selectedMember);

            let response = await fetch(`/api/dependencies/${selectedMemberId}`);
            dependenciesResponse = await response.json();
            
            if(dependenciesResponse.error) handleError (dependenciesResponse);

            else{

                utils.hideLoader();

               let isEmpty = (Object.keys(dependenciesResponse.dependencyTree).length === 0);
                
                //if the response contains results
                if(!isEmpty){
                    treeApi.createDependencyTree(dependenciesResponse.dependencyTree);
                    utils.showHelpText(selectedMember);
                }
                else{
                    document.getElementById('tree').appendChild(utils.createWarning('No results. Either this metadata does not reference any other metadata or it is part of a managed package, in which case we are unable to see its dependencies.'));
                }
    
                utils.enableButton(findButton);
            }
        });

        document.getElementById('package-button').addEventListener('click', () => {
           
            let hiddenLink = document.createElement('a');
            hiddenLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dependenciesResponse.package));
            hiddenLink.setAttribute('download', `${dependenciesResponse.entryPoint.name}-package.xml`);            
            hiddenLink.style.display = 'none';

            document.body.appendChild(hiddenLink);
            hiddenLink.click();
            document.body.removeChild(hiddenLink);              
        })
    }

    return {
        addEvents : addEvents
    }


}();

SFDM.addEvents();
