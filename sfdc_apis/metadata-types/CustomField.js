/**
 * This module is for finding references to custom fields that are not (at the time of this writing) supported
 * by the MetadataComponentDependency object. In other words, these are references that we find manually by
 * matching the field id in other metadata types. 
 */

let restAPI = require('../rest');
let metadataAPI = require('../metadata');
const logError = require('../../services/logging');
let utils = require('../../services/utils');


async function findReferences(connection,entryPoint,cache,options){

    let references = [];
    let restApi = restAPI(connection);
    let mdapi = metadataAPI(connection);

    let workflowRules = [];
    let workflowFieldUpdates = [];
    let metadataTypeRecords = [];

    let edf = await getEntityDefinitionFormat(restApi,entryPoint.id);

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

    try {
        metadataTypeRecords = await findMetadataTypeRecords();
    } catch (error) {
        logError('Error while finding metadata type records',{entryPoint,error});
    }

    references.push(
        ...workflowRules,
        ...workflowFieldUpdates,
        ...metadataTypeRecords
    );

    return references;

    /**
     * Custom Metadata Types can reference custom fields using a special field type known as FieldDefinition lookup.
     * Here we try to manually find those references by finding which objects are metadata types and then
     * querying some of their fields to see if any of them match on the field id.
     */
    async function findMetadataTypeRecords(){

        let metadataTypesUsingField = [];
        if(!options.fieldInMetadataTypes) return metadataTypesUsingField;

        let mdTypeUtils = require('../metadata-types/utils/CustomMetadataTypes');

        let metadataTypeCustomFields = await mdTypeUtils.getCustomMetadataTypeFields(connection);

        if(!metadataTypeCustomFields.length) return metadataTypesUsingField;

        //we need to do a metadata retrieve of all these custom fields so that we can inspect them
        //and see which ones are of the type FieldDefinition
        let customFieldsMetadata = await mdapi.readMetadata('CustomField',metadataTypeCustomFields);

        let fieldDefinitionFields = [];

        customFieldsMetadata.forEach(fieldMd => {
            if(fieldMd.referenceTo && fieldMd.referenceTo == 'FieldDefinition'){
                fieldDefinitionFields.push(fieldMd.fullName);
            }
        });

        if(!fieldDefinitionFields.length) return metadataTypesUsingField;

        //field definition fields hold the value of a custom field using this special format
        let searchValue = `${edf.entityDefinitionId}.${edf.shortFieldId}`;

        metadataTypesUsingField = await mdTypeUtils.queryMetadataTypeForValue(connection,fieldDefinitionFields,searchValue);

        return metadataTypesUsingField;
    }

    /**
    * field updates tied to a specific field can be found
    * by looking at the FieldDefinitionId field which comes in
    * the following format FieldDefinitionId  = '01I3h000000ewd0.00N3h00000DAO0J'
    * The first id is the EntityId of the object that the field is linked to
    * for standard objects, this would be 'Account.00N3h00000DAO0J'
    * the 2nd id is the 15 digit version of the custom field id*/
    async function findWorkflowFieldUpdates(){

        let fieldDefinitionId = utils.filterableId(`${edf.entityDefinitionId}.${edf.shortFieldId}`);

        let query = `SELECT Id,name FROM WorkflowFieldUpdate WHERE FieldDefinitionId IN ('${fieldDefinitionId}')`;
        let soql = {query,filterById:true,useToolingApi:true};

        let rawResults = await restApi.query(soql);

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
            let soql = {query,filterById:false,useToolingApi:true};
    
            let rawResults = await restApi.query(soql);

            //maps cannot be cached on redis so we create a mirror
            //of the below map in array format so that we can cache it
            let mappedData = [];
    
            rawResults.records.forEach(record => {

                //workflow rule names allow for following characters < > &, which must be escapted to valid XML before we read
                //the metadata using the metadata API, as it is XML-based
                let escapedName = record.Name.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
                let fullWfName = `${objectName}.${escapedName}`;
                idsByWorkflowName.set(fullWfName,record.Id);
                mappedData.push(`${fullWfName}:${record.Id}`);
    
            });
    
            //we do a metadata retrieve on the workflow rules to inspect them and see if they
            //reference the field in question
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

/**
 * Most of the references to custom fields use this special format
 * where Account.My_Field__c is translated to Account.0345000345465 (15 digit id)
 * or My_Object__c.my_Field__c to 00554567576.24565766477 (object and field id)
 * 
 * So here we pass the field id and get an object that has both the object id
 * and the short field id. Subsequent API calls within this module will use
 * any of these 2 values as needed.
 */
async function getEntityDefinitionFormat(restApi,id){

    let fieldId = utils.filterableId(id);
    let query = `SELECT EntityDefinitionId FROM CustomField WHERE Id IN ('${fieldId}')`;
    let soql = {query,filterById:true,useToolingApi:true};

    let rawResults = await restApi.query(soql);

    let entityDefinitionId = rawResults.records[0].EntityDefinitionId;
    let shortFieldId = id.substring(0,15);

    return {entityDefinitionId,shortFieldId}
}


module.exports = findReferences;