let utils = require('../../services/utils');
let toolingAPI = require('../tooling');


async function findReferences(connection,entryPoint){

    let references = [];

    let toolingApi = toolingAPI(connection);

    let wfAlertQuery = createWfAlertQuery(entryPoint.id);
    let wfAlerts = await toolingApi.query(wfAlertQuery);
    wfAlerts = parseWfAlerts(wfAlerts);

    references.push(...wfAlerts);

    let apexClassQuery = createApexClassQuery();
    let apexClasses = await toolingApi.query(apexClassQuery);
    apexClasses = parseApexClasses(apexClasses);

    references.push(...apexClasses);

    let emailTemplQuery = createEmailTemplateQuery(entryPoint.id);
    let emailTemplate = await toolingApi.query(emailTemplQuery);
    let templateFullName = emailTemplate.records[0].FullName;

    let customLabelQuery = createCustomLabelQuery(entryPoint,templateFullName);
    let customLabels = await toolingApi.query(customLabelQuery);
    customLabels = parseCustomLabels(customLabels);
    
    references.push(...customLabels);

    return references;

    function parseWfAlerts(rawResults){

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

    function parseApexClasses(rawResults){

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

    function parseCustomLabels(rawResults){

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

}

function createEmailTemplateQuery(emailTemplateId){

    let ids = utils.filterableId(emailTemplateId);

    let query = `SELECT FullName
    FROM EmailTemplate WHERE Id IN ('${ids}')`;

    return {query,filterById:true};
}

function createCustomLabelQuery(entryPoint,templateFullName){

    //remove the folder part of the name
    templateFullName = templateFullName.substr(templateFullName.indexOf('/')+1);

    let query = `SELECT Id, Name , NamespacePrefix FROM 
    externalString WHERE value IN ('${entryPoint.name}','${entryPoint.id}','${templateFullName}')`

    return {query,filterById:false};
}

function createWfAlertQuery(emailTemplateId){

    let ids = utils.filterableId(emailTemplateId);

    let query = `SELECT Id,TableEnumOrId,DeveloperName,NamespacePrefix 
    FROM WorkflowAlert WHERE TemplateId IN ('${ids}')`;

    return {query,filterById:false,apiVersionOverride:'32.0'};

}

/**
 * Returns apex classes that dynamically reference the emailtemplate object. These classes potentially
 * use the email template in question. 
 */
function createApexClassQuery(){

    let query = `select MetadataComponentName, MetadataComponentId,MetadataComponentNamespace from MetadataComponentDependency 
    where MetadataComponentType = 'ApexClass' AND RefMetadataComponentId = 'EmailTemplate'`;

    //we use this specific version of the API because on this version the RefMetadataComponentId field
    //can be filtered by the string 'EmailTemplate'. We want to be able to run this query even if the API
    //evolves or 'fixes' this
    return {query,filterById:false,apiVersionOverride:'48.0'};

}

function createDependencyRecord(name,type,id,url,notes,namespace){

    return {name,type,id,url,notes,namespace}

}



module.exports = findReferences;