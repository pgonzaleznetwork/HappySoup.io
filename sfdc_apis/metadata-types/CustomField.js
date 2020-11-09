let toolingAPI = require('../tooling');
let metadataAPI = require('../../sfdc_apis/metadata');
const logError = require('../../services/logging');
let utils = require('../../services/utils');


async function findReferences(connection,entryPoint,cache){

    let references = [];
    let toolingApi = toolingAPI(connection);
    let mdapi = metadataAPI(connection);

    let workflowRules = [];
    let workflowFieldUpdates = [];

    try {
        workflowRules = await findWorkflowRules();
    } catch (error) {
        logError('Error while finding workflow rules',{entryPoint,error});
    }

    try {
        workflowFieldUpdates = await findWorkflowFieldUpdates();
    } catch (error) {
        logError('Error while finding workflow field updates',{entryPoint,error});
    }

    references.push(
        ...workflowRules,
        ...workflowFieldUpdates
    );

    return references;

    async function findWorkflowFieldUpdates(){

        //field updates tied to a specific field can be found
        //by looking at the FieldDefinitionId field which comes in
        //the following format FieldDefinitionId  = '01I3h000000ewd0.00N3h00000DAO0J'
        //The first id is the EntityId of the object that the field is linked to
        //for standard objects, this would be 'Account.00N3h00000DAO0J'
        //the 2nd id is the 15 digit version of the custom field id

        let fieldId = utils.filterableId(entryPoint.id);
        let query = `SELECT EntityDefinitionId FROM CustomField WHERE Id IN ('${fieldId}')`;
        let soql = {query,filterById:true};

        let rawResults = await toolingApi.query(soql);

        let entityDefinitionId = rawResults.records[0].EntityDefinitionId;
        let shortFieldId = entryPoint.id.substring(0,15);

        let fieldDefinitionId = utils.filterableId(`${entityDefinitionId}.${shortFieldId}`);

        query = `SELECT Id,name FROM WorkflowFieldUpdate WHERE FieldDefinitionId IN ('${fieldDefinitionId}')`;
        soql = {query,filterById:true};

        rawResults = await toolingApi.query(soql);

        let objectName = entryPoint.name.split('.')[0];

        let fieldUpdates = rawResults.records.map(fieldUpdate => {

            //we guess the API name by replacing spaces with underscores
            //to get the real API name we'd have to query each field update
            //1 by 1 and it's not really worth it
            let apiName = fieldUpdate.Name.replace(/ /g,"_");

            let simplified = {
                name:`${objectName}.${apiName}`,
                type:'WorkflowFieldUpdate',
                id: fieldUpdate.Id,
                url:`${connection.url}/${fieldUpdate.Id}`,
                notes:null,       
            }
    
            return simplified;
        });

        return fieldUpdates;

    }

    async function findWorkflowRules(){

        //the entryPoint name is the full API name i.e Case.My_Custom_Field__c
        //here we split it and get the 2 parts
        let [objectName,fieldName] = entryPoint.name.split('.');

        let workflowRuleMetadata = [];
        let idsByWorkflowName = new Map();

        if(cache.getWorkflowRules(objectName)){

            let cachedData = cache.getWorkflowRules(objectName);
            workflowRuleMetadata = cachedData.cachedWorkflows;
            let mappedData = cachedData.mappedData;

            mappedData.forEach(data => {
                let [fullName,Id] = data.split(':');
                idsByWorkflowName.set(fullName,Id);
            });
        }
        else{

            let query = `SELECT name, Id FROM WorkflowRule WHERE TableEnumOrId = '${objectName}'`;
            let soql = {query,filterById:false};
    
            let rawResults = await toolingApi.query(soql);

            //maps cannot be cached on redis so we create a mirror
            //of the below map in array format so that we can cache it
            let mappedData = [];
    
            rawResults.records.forEach(record => {
    
                let fullWfName = `${objectName}.${record.Name}`;
                idsByWorkflowName.set(fullWfName,record.Id);
                mappedData.push(`${fullWfName}:${record.Id}`);
    
            });
    
            workflowRuleMetadata = await mdapi.readMetadata('WorkflowRule',Array.from(idsByWorkflowName.keys()));

            //we don't need to store all the data in the cache
            //so we simplify the object
            //this reducdes redis storage needs
            let cachedWorkflows = workflowRuleMetadata.map(wf => {

                let details = {
                    fullName:wf.fullName,
                };

                if(wf.formula){
                    details.formula = wf.formula;
                }
                else if(wf.criteriaItems){
                    details.criteriaItems = wf.criteriaItems;
                }

                return details;

            });

            let cacheData = {cachedWorkflows,mappedData};
            cache.cacheWorkflowRules(objectName,cacheData);
        }


        let wfsUsingField = [];

        workflowRuleMetadata.forEach(wf => {

            try {

                if(wf.formula){
                    //formulas can be strings or booleans so we need to make sure
                    //we are checking against the correct type
                    if(typeof wf.formula === 'string' || wf.formula instanceof String){
                        if(wf.formula.includes(fieldName)){
                            wfsUsingField.push(wf.fullName);
                        }
                    }
                }
    
                
                if(wf.criteriaItems){
    
                    if(Array.isArray(wf.criteriaItems)){
                        wf.criteriaItems.forEach(criteria => {
                            if(criteria.field == entryPoint.name){
                                wfsUsingField.push(wf.fullName);
                            }
                        });
                    }
                    else{
                        if(wf.criteriaItems.field == entryPoint.name){
                            wfsUsingField.push(wf.fullName);
                        }
                    }                
                }
            } catch (error) {
                logError('Error when processing workflow rule',{wf,error});
            }

            
        });

        wfsUsingField = wfsUsingField.map(wf => {

            let workflowId = idsByWorkflowName.get(wf);

            let simplified = {
                name:wf,
                type:'WorkflowRule',
                id: workflowId,
                url:`${connection.url}/${workflowId}`,
                notes:null,       
            }
    
            return simplified;
        });

        return wfsUsingField;
    }   
}



module.exports = findReferences;