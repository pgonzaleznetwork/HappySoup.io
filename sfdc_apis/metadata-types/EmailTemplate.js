let utils = require('../../services/utils');
let toolingAPI = require('../tooling');


async function findReferences(connection,entryPoint){

    let references = [];
    let toolingApi = toolingAPI(connection);

    references.push(
        ...await findWorkflowAlerts(),
        ...await findApexClasses(),
        ...await findCustomLabels()
    );

    return references;

    async function findCustomLabels(){

        let ids = utils.filterableId(entryPoint.id);

        //we need the template full name to see if it's referenced in any soql queries
        //the full name is the api name, which is not the same as the entryPoint.name
        //because entryPoint.name comes from a bulk query on the EmailTemplate object
        //and querying the fullName is only allowed when the query returns 1 record
        let query = `SELECT FullName
        FROM EmailTemplate WHERE Id IN ('${ids}')`;
    
        let soql = {query,filterById:true};

        let templateFullName;

        //this can throw an error if the email template is in a private user's folder
        try {
            let rawResults = await toolingApi.query(soql);
            templateFullName = rawResults.records[0].FullName;
            //remove the folder part of the name
            templateFullName = templateFullName.substr(templateFullName.indexOf('/')+1);
        } catch (error) {
            //since we cannot query the email template, we'll make an educated guess
            //and assume that the full name is the same as the name but with underscores
            //instead of spaces, which is the default behaviour when you create a template
            //via the UI and don't manually specificy an API name
            //i.e "My Template Name" becomes "My_Template_Name"
            templateFullName = entryPoint.name.replace(/ /g,"_");
        }

        query = `SELECT Id, Name , NamespacePrefix FROM 
        externalString WHERE value IN ('${entryPoint.name}','${entryPoint.id}','${templateFullName}')`

        soql =  {query,filterById:false};

        let rawResults = await toolingApi.query(soql);

        let customLabels = rawResults.records.map(record => {
    
            let simplified = {
                name:record.Name,
                type:'CustomLabel',
                id: record.Id,
                url:`${connection.url}/${record.Id}`,
                notes:null,
                namespace: record.NamespacePrefix,       
            }
    
            return simplified;          
        });
    
        return customLabels;
    }

    async function findWorkflowAlerts(){

        let ids = utils.filterableId(entryPoint.id);

        let query = `SELECT Id,TableEnumOrId,DeveloperName,NamespacePrefix 
        FROM WorkflowAlert WHERE TemplateId IN ('${ids}')`;
    
        //we use a lower version of the API to be able to query the TableEnumOrId
        //as this field is only available on lower versions
        let soql = {query,filterById:false,apiVersionOverride:'32.0'};

        let rawResults = await toolingApi.query(soql);

        let wfAlerts = rawResults.records.map(record => {
    
            let simplified = {
                name:`${record.TableEnumOrId}.${record.DeveloperName}`,
                type:'WorkflowAlert',
                id: record.Id,
                url:`${connection.url}/${record.Id}`,
                notes:null,
                namespace: record.NamespacePrefix,       
            }
    
            return simplified;          
        });
    
        return wfAlerts;
    }

    /**
     * Returns apex classes that dynamically reference the emailtemplate object. These classes potentially
     * use the email template in question. 
     */
    async function findApexClasses(){

        let query = `select MetadataComponentName, MetadataComponentId,MetadataComponentNamespace from MetadataComponentDependency 
        where MetadataComponentType = 'ApexClass' AND RefMetadataComponentId = 'EmailTemplate'`;

        //we use this specific version of the API because on this version the RefMetadataComponentId field
        //can be filtered by the string 'EmailTemplate'. We want to be able to run this query even if the API
        //evolves or 'fixes' this
        let soql = {query,filterById:false,apiVersionOverride:'48.0'};

        let rawResults = await toolingApi.query(soql);

        let apexClasses = rawResults.records.map(record => {
    
            let simplified = {
                name:record.MetadataComponentName,
                type:`ApexClass with EmailTemplate SOQL`,
                id:record.MetadataComponentId,
                url:`${connection.url}/${record.MetadataComponentId}`,
                notes:null,
                namespace: record.MetadataComponentNamespace,      
            }

            return simplified;          
        });

        return apexClasses;
    }
}



module.exports = findReferences;