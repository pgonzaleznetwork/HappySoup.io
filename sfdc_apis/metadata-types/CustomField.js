/**
 * This module is for finding references to custom fields that are not (at the time of this writing) supported
 * by the MetadataComponentDependency object. In other words, these are references that we find manually by
 * matching the field id in other metadata types. 
 */

let restAPI = require('../rest');
let metadataAPI = require('../metadata');
const logError = require('../../services/logging');
let utils = require('../../services/utils');
let {findWorkflowRules,findWorkflowFieldUpdates} = require('../metadata-types/utils/workflows');


async function findReferences(connection,entryPoint,cache,options){

    let references = [];
    let restApi = restAPI(connection);
    let mdapi = metadataAPI(connection);

    let workflowRules = [];
    let workflowFieldUpdates = [];
    let metadataTypeRecords = [];

    let edf = await getEntityDefinitionFormat(restApi,entryPoint.id);

    try {
        workflowRules = await findWorkflowRules(connection,entryPoint,cache);
    } catch (error) {
        logError('Error while finding workflow rules',{entryPoint,error});
    }

    try {
        let objectName = entryPoint.name.split('.')[0];
        workflowFieldUpdates = await findWorkflowFieldUpdates(connection,objectName,`${edf.entityDefinitionId}.${edf.shortFieldId}`);
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