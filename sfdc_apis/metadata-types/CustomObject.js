/**
 * This module is for finding references to custom objects that are not (at the time of this writing) supported
 * by the MetadataComponentDependency object. In other words, these are references that we find manually by
 * matching the object id in other metadata types. 
 */

let metadataAPI = require('../metadata');
const logError = require('../../services/logging');

async function findReferences(connection,entryPoint,cache,options){

    let references = [];
    let mdapi = metadataAPI(connection);

    let metadataTypeRecords = [];

    try {
        metadataTypeRecords = await findMetadataTypeRecords();
    } catch (error) {
        logError('Error while finding metadata type records for custom objects',{entryPoint,error});
    }

    references.push(
        ...metadataTypeRecords
    );

    /**
     * Custom Metadata Types can reference custom objects using a special field type known as EntityDefinition lookup.
     * Here we try to manually find those references by finding which objects are metadata types and then
     * querying some of their fields to see if any of them match on the object id.
     */
    async function findMetadataTypeRecords(){

        let metadataTypesUsingObject = [];
        if(!options.objectInMetadataTypes) return metadataTypesUsingObject;

        let mdTypeUtils = require('../metadata-types/utils/CustomMetadataTypes');

        let metadataTypeCustomFields = await mdTypeUtils.getCustomMetadataTypeFields(connection);

        if(!metadataTypeCustomFields.length) return metadataTypesUsingObject;

        //we need to do a metadata retrieve of all these custom fields so that we can inspect them
        //and see which ones are of the type EntityDefinition
        let customFieldsMetadata = await mdapi.readMetadata('CustomField',metadataTypeCustomFields);

        let entityDefinitionFields = [];

        customFieldsMetadata.forEach(fieldMd => {
            if(fieldMd.referenceTo && fieldMd.referenceTo == 'EntityDefinition'){
                entityDefinitionFields.push(fieldMd.fullName);
            }
        });

        if(!entityDefinitionFields.length) return metadataTypesUsingObject;

        let searchValue;

        //in standard objects the name and id are the same, and so the entity
        //definition id is also the name i.e Account or Opportunity
        if(entryPoint.name == entryPoint.id){
            searchValue = entryPoint.name;
        }
        else{
            //for custom objects, the entity definition id is the 15 digit version
            //of the object id
            searchValue = entryPoint.id.substring(0,15);
        }

        metadataTypesUsingObject = await mdTypeUtils.queryMetadataTypeForValue(connection,entityDefinitionFields,searchValue);

        return metadataTypesUsingObject;
    }

    return references;
}

module.exports = findReferences;