
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
        let canvasContainer = byId('canvas-container');
        let canvas = byId('stats');
        let barChart;
        let memberIdsByName = new Map();
        let lastApiResponse;
        let selectedMetadataType;
        let latestIntervalId;
        let latestInvertalDone = false;

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

            utils.showProgressBar();
            utils.toggleDropdown(mdDropDown,true);
            utils.disableInputField(inputField);
            utils.disableButton(searchButton);

            selectedMetadataType = event.target.value;

            let res = await fetch(`/api/metadata?mdtype=${selectedMetadataType}`);
            let json = await res.json();

            let {jobId} = json;

            if(jobId){
                callItselfWhenJobIsDone(jobId,getMetadataMembers,arguments);
            }     

            else if(json.error){
                handleError(json);
                utils.toggleDropdown(mdDropDown,false);
                utils.hideProgressBar();
            }
            else{

                let members = [];

                json.forEach(metadata => {
                    let [fullName,id] = metadata.split(':');
                    members.push(fullName);
                    memberIdsByName.set(fullName,id);
                })
                
                autocompleteApi.autocomplete(inputField, members);
    
                utils.enableInputField(inputField);
                utils.toggleDropdown(mdDropDown,false);
                utils.hideProgressBar();
            }   
        }

    
        async function doSearch(){

            let selectedMember = inputField.value;
            let selectedQueryType = queryTypeDropDown.value;
            let selectedMemberId = memberIdsByName.get(selectedMember);

            if(selectedMember == ''){
                window.alert('Please select a metadata member');
                return;
            }

            if(selectedQueryType == ''){
                window.alert('Please select a query type');
                return;
            }

            displayLoadingUI();

            if(selectedQueryType == 'deps'){
                findDependencies(selectedMember,selectedMemberId,selectedMetadataType);
            }
            else if(selectedQueryType == 'usage'){
                findUsage(selectedMember,selectedMemberId,selectedMetadataType);
            }    
        }

        async function findUsage(selectedMember,selectedMemberId,selectedMetadataType){

            let url = `api/usage?name=${selectedMember}&id=${selectedMemberId}&type=${selectedMetadataType}`;

            let response = await fetch(url);
            let json = await response.json();

            let {jobId} = json;

            if(jobId){
                callItselfWhenJobIsDone(jobId,findUsage,arguments);
            }    
            
            else if(json.error) handleError(response);

            else{
                
                utils.hideLoader();

                let isEmpty = (Object.keys(json.usageTree).length === 0);
                
                //if the response contains results
                if(!isEmpty){
                    displayStats(json.stats,'usage');
                    treeApi.createUsageTree(json.usageTree,usageTreePlaceholder);
                    utils.showHelpText(json.entryPoint.name,'usage');
                    lastApiResponse = json;
                }
                else{
                    usageTreePlaceholder.appendChild(utils.createWarning('No results. Either this metadata is not referenced/used by any other metadata or it is part of a managed package, in which case we are unable to see its dependencies.'));
                }

                utils.toggleDropdown(mdDropDown,false);
                utils.enableButton(searchButton);
            }
        }

        async function findDependencies(selectedMember,selectedMemberId,selectedMetadataType){

            let url = `api/dependencies?name=${selectedMember}&id=${selectedMemberId}&type=${selectedMetadataType}`;

            let response = await fetch(url);
            let json = await response.json();

            let {jobId} = json;

            if(jobId){
                callItselfWhenJobIsDone(jobId,findDependencies,arguments);
            }    
            
            else if(json.error) handleError(response);

            else{

                utils.hideLoader();

               let isEmpty = (Object.keys(json.dependencyTree).length === 0);
                
                //if the response contains results
                if(!isEmpty){
                    displayStats(json.stats,'deps');
                    treeApi.createDependencyTree(json.dependencyTree,dependencyTreePlaceholder);
                    utils.showHelpText(json.entryPoint.name,'deps');
                    lastApiResponse = json;
                }
                else{
                    dependencyTreePlaceholder.appendChild(utils.createWarning('No results. Either this metadata does not reference any other metadata or it is part of a managed package, in which case we are unable to see its dependencies.'));
                }

                utils.toggleDropdown(mdDropDown,false);
                utils.enableButton(searchButton);
            }
        }

        function displayStats(stats,type){

            //remove the contents of the previously initialized chart
            if(barChart){
                barChart.destroy();
            }

            let availableBackgroundColors = [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ];
            let chartLabels = [];
            let chartValues = [];

            for (const key in stats) {
                chartLabels.push(key);
                chartValues.push(stats[key]);
            }

            let backgroundColors = [];

            chartLabels.forEach(val => {
                let randomValue = availableBackgroundColors[Math.floor(Math.random() * availableBackgroundColors.length)]; 
                backgroundColors.push(randomValue);
            })

            let ctx = canvas.getContext('2d');

            let label = (type === 'usage' ? '# of Metadata Types using it' : '# of Metadata Types required for deployment');

            canvasContainer.style.display = 'block';

            barChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: label,
                        data: chartValues,
                        backgroundColor: backgroundColors,
                        borderWidth: 2
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            }); 
        }

        async function callItselfWhenJobIsDone(jobId,originalFunction,params){

            params = Array.from(params);

            let details = {jobId,originalFunction,params};
                
            latestInvertalDone = false;
            latestIntervalId = window.setInterval(checkJobStatus,2000,details);
        }

        async function checkJobStatus({jobId,originalFunction,params}){

            //barWidth += 10;

            //progressBar.style.width = barWidth+'%';

            let res = await fetch(`/api/job/${jobId}`);
            let result = await res.json();

            let {state,error} = result;

            if(state == 'completed' && !latestInvertalDone){
                stopPolling();
                await originalFunction(...params);
            }
            else if(state == 'failed' && !latestInvertalDone){
                stopPolling();
                handleError(error);
            }
        }

        function stopPolling(){
            latestInvertalDone = true;
            window.clearInterval(latestIntervalId);
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

        function displayLoadingUI(){
            
            utils.hideTrees();
            utils.hideHelpText();
            utils.disableButton(searchButton);
            utils.toggleDropdown(mdDropDown,true);
            utils.showLoader();
            utils.hideChart();
        }
    }

    return { addEvents}


}();


SFDM.addEvents();

