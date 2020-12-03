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

    async function findMetadataTypeRecords(){

        let metadataTypesUsingField = [];
        if(!options.fieldInMetadataTypes) return metadataTypesUsingField;

        function parseMetadataTypeRecord(record){

            let simplified = {
                name: record.DeveloperName,
                type: record.attributes.type,
                id: record.Id,
                url:`${connection.url}/${record.Id}`,
                notes:null,       
            }
            return simplified;
        }

        let searchValue = `${edf.entityDefinitionId}.${edf.shortFieldId}`;

        let cachedData = cache.getMetadataTypesWithFieldDefinitions();

        if(cachedData.length){

            cachedData.forEach(record => {

                Object.keys(record).forEach(key => {
                    if(typeof record[key] === 'string' && record[key] == searchValue){
                        metadataTypesUsingField.push(parseMetadataTypeRecord(record));
                    }
                })
            })   
            
            return metadataTypesUsingField;
        }

        //we need to get all the objects in the org to find
        //out which ones are actually custom metadata types
        let sObjects = await restApi.getSObjectsDescribe();
        let customMetadataTypes = [];
      
        sObjects.forEach(sobj => {
            //metadata types end with __mdt
            if(sobj.name.includes('__mdt')){

                //once we have identified a custom metadata type, we need to find its id
                //by querying the customObject object of the tooling API

                //for some reason this API expects the object name to be passed without
                //a namespace prefix and without the __mdt suffix, so we have to remove
                //both of this here

                let name;
                let indexOfPrefix = sobj.name.indexOf('__');
                let indexOfSuffix = sobj.name.indexOf('__mdt');

                if(indexOfPrefix == indexOfSuffix){
                    //if it's the same, there there's only 1, which by
                    //default would be the suffix, so we remove it
                    name = sobj.name.substring(0,indexOfSuffix);
                }
                else{

                    //if they are different, then the first one is a namespace prefix
                    //which needs to be removed for now

                    //remove the suffix
                    name = sobj.name.substring(0,indexOfSuffix);     
                    //remove the prefix
                    name = name.substring(indexOfPrefix+2);
                }

                customMetadataTypes.push(name);
            }
        });
        

        //it's possible that the org doesn't have metadata types
        //so we exit early
        if(customMetadataTypes.length){

            let filterNames = utils.filterableId(customMetadataTypes);

            //the sobjects describe call from the rest API that we did earlier doesn't include
            //the object id, so we need to query it here manually
            //this will then be used to query all the custom fields that belong to a specific metadata type
            let query = `SELECT Id,DeveloperName,NamespacePrefix FROM CustomObject WHERE DeveloperName  IN ('${filterNames}')`;
            let soql = {query,filterById:false,useToolingApi:true};
            let rawResults = await restApi.query(soql);

            let metadataTypesById = new Map();

            rawResults.records.map(obj => {
                if(obj.NamespacePrefix){
                    obj.DeveloperName = `${obj.NamespacePrefix}__${obj.DeveloperName}`;
                }
                obj.DeveloperName += '__mdt';
                metadataTypesById.set(obj.Id,obj.DeveloperName);
            });

            let filterTableOrEnumIds = utils.filterableId(Array.from(metadataTypesById.keys()));

            //now we query all the custom fields belonging to custom metadata types
            query = `SELECT Id,DeveloperName,TableEnumOrId,NamespacePrefix FROM CustomField WHERE TableEnumOrId  IN ('${filterTableOrEnumIds}')`;
            soql = {query,filterById:false,useToolingApi:true};

            rawResults = await restApi.query(soql);

            let fullFieldNames = [];

            //once we have all the fields, we build their full name using the metadata type
            //id map. Ideally we would've queried the full name in the previous query but
            //the tooling API doesn't allow queries on the fullName if the query returns
            //more than one result
            rawResults.records.forEach(field => {

                 //the reason we add the field prefix using the field object itself and not the
                //the prefix from owning metadata type is because the field may not have
                //the same prefix as its owning metadata type. This can happen if the metadata type
                //is from an unlocked package, but the field was created manually on top of that metadata type
                //which would result in the field not having a namespace
                //so we add the namespace based on the actual namespace of the field and not under the assumption
                //that it has the same namespace as its parent*/

                let metadataTypeName = metadataTypesById.get(field.TableEnumOrId);
                
                if(field.NamespacePrefix){
                    field.DeveloperName = `${field.NamespacePrefix}__${field.DeveloperName}`;
                }

                let fullFieldName = `${metadataTypeName}.${field.DeveloperName}__c`;
                fullFieldNames.push(fullFieldName);
            });

            //now that we have the full names, we issue a readMetadata call to inspect the
            //details of each custom field
            let customFieldsMetadata = await mdapi.readMetadata('CustomField',fullFieldNames);

            let fieldsThatReferenceFieldDefinition = [];

            //finally here, we determine if the field is a lookup to a fieldDefinition
            customFieldsMetadata.forEach(fieldMd => {
                if(fieldMd.referenceTo && fieldMd.referenceTo == 'FieldDefinition'){
                    fieldsThatReferenceFieldDefinition.push(fieldMd.fullName);
                }
            });

            //now we have the objects and fields that point to a custom field
            //The next step is to query each individual object, checking if the field in question
            //matches the search value
            //to do that, we map the fields by the object name
            //note that a single metadata type can have multiple fields that point to field definitions
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

            //we need to build on query per field because you can't use OR in custom metadata
            //types SOQL
            for (let [objectName, fields] of fieldsByObjectName) {
     
                fields.forEach(field => {
                    let query = `SELECT Id , ${field}, DeveloperName FROM ${objectName} WHERE ${field} != null`;
                    queries.push(query);
                });
            }

            //once we have all the queries, we 
            //execute them in parallel
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

                //now we go through the results
                //if the record has a key, whos value matches the search value, we 
                //consider this a match
                //we do this because as explained earlier, a single record can have multiple
                //fields of type field definition. So rather than keeping track of all the
                //fields per object, we just check if a key value matches the search value
                Object.keys(record).forEach(key => {
                    if(typeof record[key] === 'string' && record[key] == searchValue){
                        metadataTypesUsingField.push(parseMetadataTypeRecord(record));
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