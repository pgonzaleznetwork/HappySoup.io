let toolingAPI = require('../tooling');
let metadataAPI = require('../../sfdc_apis/metadata');
let restAPI = require('../../sfdc_apis/rest');
const logError = require('../../services/logging');
let utils = require('../../services/utils');


async function findReferences(connection,entryPoint,cache,options){

    let references = [];
    let toolingApi = toolingAPI(connection);
    let mdapi = metadataAPI(connection);
    let restApi = restAPI(connection);

    let workflowRules = [];
    let workflowFieldUpdates = [];
    let metadataTypeRecords = [];

    let entitiyDefinitionFormat = await getEntityDefinitionFormat(toolingApi,entryPoint.id);

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

    async function findMetadataTypeRecords(){

        let metadataTypesUsingField = [];

        if(!options.fieldInMetadataTypes) return metadataTypesUsingField;

        let searchValue = `${entitiyDefinitionFormat.entityDefinitionId}.${entitiyDefinitionFormat.shortFieldId}`;

        let cachedData = cache.getMetadataTypesWithFieldDefinitions();

        if(cachedData.length){

            cachedData.forEach(record => {

                Object.keys(record).forEach(key => {
                    if(typeof record[key] === 'string' && record[key] == searchValue){
                        let simplified = {
                            name: `${record.DeveloperName} (${record.attributes.type})`,
                            type: 'Custom Metadata Record',
                            id: record.Id,
                            url:`${connection.url}/${record.Id}`,
                            notes:null,       
                        }
                        metadataTypesUsingField.push(simplified);
                    }
                })
            })   
            
            return metadataTypesUsingField;
        }

    
        let sObjects = await restApi.getSObjectsDescribe();
        let customMetadataTypes = [];
        
        sObjects.forEach(sobj => {
            if(sobj.name.includes('__mdt')){
                let index = sobj.name.indexOf('__mdt');
                let name = sobj.name.substring(0,index);
                customMetadataTypes.push(name);
            }
        });

        if(customMetadataTypes.length){

            let filterNames = utils.filterableId(customMetadataTypes);

            let query = `SELECT Id,DeveloperName FROM CustomObject WHERE DeveloperName  IN ('${filterNames}')`;

            let soql = {query,filterById:false};

            let rawResults = await toolingApi.query(soql);

            let metadataTypesById = new Map();

            rawResults.records.map(obj => {
                metadataTypesById.set(obj.Id,obj.DeveloperName);
            });

            let filterTableOrEnumIds = utils.filterableId(Array.from(metadataTypesById.keys()));

            query = `SELECT Id,DeveloperName,TableEnumOrId FROM CustomField WHERE TableEnumOrId  IN ('${filterTableOrEnumIds}')`;
            //console.log(query);
            soql = {query,filterById:false};

            rawResults = await toolingApi.query(soql);

            let fullFieldNames = [];

            rawResults.records.forEach(field => {
                let metadataTypeName = metadataTypesById.get(field.TableEnumOrId);
                metadataTypeName += '__mdt';
                let fullFieldName = `${metadataTypeName}.${field.DeveloperName}__c`;
                fullFieldNames.push(fullFieldName);
            });

            let customFieldsMetadata = await mdapi.readMetadata('CustomField',fullFieldNames);

            let fieldsThatReferenceFieldDefinition = [];

            customFieldsMetadata.forEach(fieldMd => {
                if(fieldMd.referenceTo && fieldMd.referenceTo == 'FieldDefinition'){
                    fieldsThatReferenceFieldDefinition.push(fieldMd.fullName);
                }
            });

            //now we need to group by custom object

            let fieldsByObjectName = new Map();

            fieldsThatReferenceFieldDefinition.forEach(field => {

                let [objectName,fieldName] = field.split('.');
                
                if(fieldsByObjectName.get(objectName)){
                    fieldsByObjectName.get(objectName).push(fieldName);
                }
                else{
                    fieldsByObjectName.set(objectName,[fieldName]);
                }

            });

            let queries = [];

            for (let [objectName, fields] of fieldsByObjectName) {
     
                //we need to build on query per field because you can't use OR in custom metadata
                //types SOQL
                fields.forEach(field => {
                    let query = `SELECT Id , ${field}, DeveloperName FROM ${objectName} WHERE ${field} != null`;
                    queries.push(query);
                });
            }


            let data = await Promise.all(

                queries.map(async (query) => {
                    let soql = {query,filterById:false}
                    let rawResults = await restApi.query(soql);
                    
                    return rawResults.records;
                })
            )

            let allData = [];

            data.forEach(d => allData.push(...d));

            cache.cacheMetadataTypesWithFieldDefinitions(allData);

            allData.forEach(record => {

                Object.keys(record).forEach(key => {
                    if(typeof record[key] === 'string' && record[key] == searchValue){
                        let simplified = {
                            name: `${record.DeveloperName} (${record.attributes.type})`,
                            type: 'Custom Metadata Record',
                            id: record.Id,
                            url:`${connection.url}/${record.Id}`,
                            notes:null,       
                        }
                        metadataTypesUsingField.push(simplified);
                    }
                })
            })            
        }
        return metadataTypesUsingField;
    
    }

    async function findWorkflowFieldUpdates(){

        //field updates tied to a specific field can be found
        //by looking at the FieldDefinitionId field which comes in
        //the following format FieldDefinitionId  = '01I3h000000ewd0.00N3h00000DAO0J'
        //The first id is the EntityId of the object that the field is linked to
        //for standard objects, this would be 'Account.00N3h00000DAO0J'
        //the 2nd id is the 15 digit version of the custom field id

        let fieldDefinitionId = utils.filterableId(`${entitiyDefinitionFormat.entityDefinitionId}.${entitiyDefinitionFormat.shortFieldId}`);

        let query = `SELECT Id,name FROM WorkflowFieldUpdate WHERE FieldDefinitionId IN ('${fieldDefinitionId}')`;
        let soql = {query,filterById:true};

        let rawResults = await toolingApi.query(soql);

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

                //workflow rule names allow for following characters < > &, which must be escapted to valid XML before we read
                //the metadata using the metadata API, as it is XML-based
                let escapedName = record.Name.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
                let fullWfName = `${objectName}.${escapedName}`;
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

async function getEntityDefinitionFormat(toolingApi,id){

    let fieldId = utils.filterableId(id);
    let query = `SELECT EntityDefinitionId FROM CustomField WHERE Id IN ('${fieldId}')`;
    let soql = {query,filterById:true};

    let rawResults = await toolingApi.query(soql);

    let entityDefinitionId = rawResults.records[0].EntityDefinitionId;
    let shortFieldId = id.substring(0,15);

    return {entityDefinitionId,shortFieldId}
}

module.exports = findReferences;