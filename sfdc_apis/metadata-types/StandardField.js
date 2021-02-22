let utils = require('../../services/utils');
let restAPI = require('../rest');
let metadataAPI = require('../metadata');
const logError = require('../../services/logging');


async function findReferences(connection,entryPoint,cache,options){

    let metadataUsingField = [];

    let restApi = restAPI(connection);
    let mdapi = metadataAPI(connection);

    //let StandardFieldName = entryPoint.id;
    let [object,field] = entryPoint.name.split('.');

    let metadataUsingObject = await queryDependeciesByObjectName(object);

    let metadataByType = new Map();

    metadataUsingObject.forEach(metadata => {

        if(metadataByType.get(metadata.type)){
            metadataByType.get(metadata.type).push(metadata);
        }
        else{
            metadataByType.set(metadata.type,[metadata]);
        }
    });

    for (let [metadataType, members] of metadataByType) {

        let params = {
            object,
            field,
            metadataType,
            members
        }

        let results = [];

        let codeBasedField = getCodeBasedField(metadataType);

        if(codeBasedField){

            params.codeBasedField = codeBasedField;

            try {

                results = await searchFieldInCode(params);
                metadataUsingField.push(...results);
            } catch (error) {
                logError('Error while searching standard field in code',params);
            }

        }
        else{

            let searchFunction = getSearchFunction(metadataType);

            if(searchFunction){

                try {
                    results = await searchFunction(params);
                    metadataUsingField.push(...results);
                } catch (error) {
                    logError('Error while searching standard field in metadata',params);
                }
            }
        } 
    }

    try {
        let workflowFieldUpdates = await findWorkflowFieldUpdates();
        metadataUsingField.push(...workflowFieldUpdates);
    } catch (error) {
        logError('Error while finding workflow field updates',{entryPoint,error});
    }

    try {
        let workflowRules = await findWorkflowRules();
        metadataUsingField.push(...workflowRules);
    } catch (error) {
        logError('Error while finding workflow field updates',{entryPoint,error});
    }

    try {
        let validationRules = await findValidationRules();
        metadataUsingField.push(...validationRules);
    } catch (error) {
        logError('Error while finding validation rules',{entryPoint,error});
    }


    return metadataUsingField;

    async function findValidationRules(){

        let query = `SELECT ValidationName, Id FROM ValidationRule WHERE EntityDefinitionId = '${object}'`;
        let soql = {query,filterById:false,useToolingApi:true};

        let rawResults = await restApi.query(soql);

        let idsByName = new Map();

        rawResults.records.forEach(record => {
            idsByName.set(`${object}.${record.ValidationName}`,record.Id);
        });


        //we do a metadata retrieve on the validation rules to inspect them and see if they
        //reference the field in question
        let validationRulesMetadata = await mdapi.readMetadata('ValidationRule',Array.from(idsByName.keys()));

    
        let validationsUsingField = [];

        validationRulesMetadata.forEach(vr => {

            try {
                //formulas can be strings or booleans so we need to make sure
                //we are checking against the correct type
                if(typeof vr.errorConditionFormula === 'string' || vr.errorConditionFormula instanceof String){
                    if(vr.errorConditionFormula.includes(field)){
                        validationsUsingField.push(vr.fullName);
                    }
                    else if(vr.errorDisplayField == field){
                        validationsUsingField.push(vr.fullName);
                    }
                }
            }catch (error) {
                logError('Error when processing validation rule',{vr,error});
            }
        })

        validationsUsingField = validationsUsingField.map(vrName => {

            let id = idsByName.get(vrName);

            let simplified = {
                name:vrName,
                type:'ValidationRule',
                id: id,
                url:`${connection.url}/${id}`,
                notes:null,       
            }
    
            return simplified;
        });

        return validationsUsingField;
    }

    async function findWorkflowFieldUpdates(){

        let query = `SELECT Id,name FROM WorkflowFieldUpdate WHERE FieldDefinitionId = '${entryPoint.name}'`;
        let soql = {query,useToolingApi:true};

        let rawResults = await restApi.query(soql);

        let fieldUpdates = rawResults.records.map(fieldUpdate => {

            //we guess the API name by replacing spaces with underscores
            //to get the real API name we'd have to query each field update
            //1 by 1 and it's not really worth it
            let apiName = fieldUpdate.Name.replace(/ /g,"_");

            let simplified = {
                name:`${object}.${apiName}`,
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


    async function queryDependeciesByObjectName(parentObjectName){

        let query = `SELECT MetadataComponentId, MetadataComponentName,MetadataComponentType,MetadataComponentNamespace, RefMetadataComponentName, RefMetadataComponentType, RefMetadataComponentId,
        RefMetadataComponentNamespace 
        FROM MetadataComponentDependency 
        WHERE RefMetadataComponentId  = '${parentObjectName}' ORDER BY MetadataComponentType`;

        let soqlQuery = {query,filterById:true,useToolingApi:true};
        let rawResults = await restApi.query(soqlQuery);   

        let callers = simplifyResults(rawResults);

        return callers;
    }

    function simplifyResults(rawResults){

        let callers = rawResults.records.map(caller => {
    
            let simplified = {
                name:caller.MetadataComponentName,
                type:caller.MetadataComponentType,
                id:caller.MetadataComponentId,
                url:`${connection.url}/${caller.MetadataComponentId}`,
                notes:null,
                namespace: caller.MetadataComponentNamespace,       
            }

            return simplified;          
        });

        return callers;
    }

    async function searchFieldInCode(params){

        let {field,codeBasedField,metadataType,members} = params;

        let fieldNameRegex = new RegExp(`${field}`,'gi');
    
        let ids = members.map(m => m.id);
        ids = utils.filterableId(ids);
    
        let query = `SELECT Id,Name,${codeBasedField},NamespacePrefix FROM ${metadataType} WHERE Id IN ('${ids}')`;
        let soqlQuery = {query,filterById:true,useToolingApi:true};
    
        let rawResults  = await restApi.query(soqlQuery);
    
        let metadataBodyById = new Map();
    
        rawResults.records.forEach(rec => {
            metadataBodyById.set(rec.Id,rec[codeBasedField]);
        });
        
        let metadataUsingField = [];
        
        members.forEach(member => {
    
            let body = metadataBodyById.get(member.id);
            if(body){
                //remove all white space/new lines
                body = body.replace(/\s/g,'');
        
                if(body.match(fieldNameRegex)){
                    metadataUsingField.push(member);
                }
            }
        });

        metadataUsingField = metadataUsingField.map(m => {
    
            let simplified = {
                name:m.name,
                type:metadataType,
                id: m.id,
                url:`${connection.url}/${m.id}`,
                notes:null,      
            }
    
            return simplified;          
        });

        return metadataUsingField;
    }

    async function searchFieldInEmailTemplate(params){

        console.log(params);

        let {field,members} = params;

        let fieldNameRegex = new RegExp(`${field}`,'gi');

        const EMAIL_TEMPLATE_QUERY_LIMIT = 50;
        let ids = [];

        //we query a max number of templates to avoid too many API calls
        for (let index = 0; index < EMAIL_TEMPLATE_QUERY_LIMIT; index++) {
            if(members[index]){
                ids.push(members[index].id);
            }  
        }

        let idsByName = new Map();

        let fullNames = await Promise.all(

            ids.map(async (id) => {

                let query = `SELECT FullName,Name,NamespacePrefix,Id FROM EmailTemplate WHERE Id = '${id}' `;
                let soqlQuery = {query,useToolingApi:true};
    
                let rawResults = await restApi.query(soqlQuery);
                let template = rawResults.records[0];

                idsByName.set(template.Name,template.Id);
            
                return template.FullName;
            })
        );


        let readMetadataResult = await mdapi.readMetadata('EmailTemplate',fullNames);

        let templatesUsingField = [];

        readMetadataResult.forEach(template => {

            let buff = new Buffer(template.content, 'base64');
            let templateContent = buff.toString('ascii');

            //remove all white space/new lines  
            templateContent = templateContent.replace(/\s/g,'');
            
            if(templateContent.match(fieldNameRegex)){
                
                let templateId = idsByName.get(template.name);

                let simplified = {
                    name:template.name,
                    type:'EmailTemplate',
                    id: templateId,
                    url:`${connection.url}/${templateId}`,
                    notes:null,      
                }

                templatesUsingField.push(simplified);
            }
       });

       return templatesUsingField;
    }

    function getSearchFunction(metadataType){

        let searchFunctionByMetadataType = new Map();
        searchFunctionByMetadataType.set('EmailTemplate',searchFieldInEmailTemplate);

        return searchFunctionByMetadataType.get(metadataType);
    
    }

}

function getCodeBasedField(metadataType){

    let codeBasedFieldByMetadataType = new Map();
    codeBasedFieldByMetadataType.set('ApexClass','Body');
    codeBasedFieldByMetadataType.set('ApexTrigger','Body');
    codeBasedFieldByMetadataType.set('ApexPage','Markup');

    return codeBasedFieldByMetadataType.get(metadataType);
}







module.exports = findReferences;