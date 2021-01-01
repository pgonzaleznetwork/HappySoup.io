/**
 * This module is for finding references to apex classes that are not (at the time of this writing) supported
 * by the MetadataComponentDependency object. In other words, these are references that we find manually by
 * matching the apex class name in other metadata types. 
 */

const logError = require('../../services/logging');


async function findReferences(connection,entryPoint,cache,options){

    let references = [];

    let metadataTypeRecords = [];

    try {
        metadataTypeRecords = await findMetadataTypeRecords();
    } catch (error) {
        logError('Error while finding metadata type records',{entryPoint,error});
    }

    references.push(
        ...metadataTypeRecords
    );

    return references;

    /**
     * Custom Metadata Types can reference apex classes by their name. This is a common pattern
     * when buiding metadata-driven trigger frameworks or the like. The class name will be referenced
     * as a simple string in a field from a custom metadata type. 
     * Here we try to manually find those references by finding which objects are metadata types and then
     * querying some of their fields to see if any of them match on the class name. 
     */
    async function findMetadataTypeRecords(){

        let metadataTypesUsingClass = [];
        if(!options.classInMetadataTypes) return metadataTypesUsingClass;

        let mdTypeUtils = require('../metadata-types/utils/CustomMetadataTypes');

        let metadataTypeCustomFields = await mdTypeUtils.getCustomMetadataTypeFields(connection);

        if(!metadataTypeCustomFields.length) return metadataTypesUsingClass;

        let fieldsThatReferenceClasses = [];

        //we assume that any field that has any of these identifiers
        //in its name, could possibly hold a value that matches the apex class name
        let classIndentifiers = ['class','handler','type','instance','trigger'];

        metadataTypeCustomFields.forEach(field => {

            //when checking if the field has any of the identifiers, we need
            //to check only the field name, excluding the object name
            //this prevents false positives like trigger_handler__mdt.not_valid__c
            //where it's the object name that matches the identifier, as opposed to the
            //actual field nae
            let fieldName = field.split('.')[1].toLowerCase();

            let fieldHasIndentifier = classIndentifiers.some(ci => {
                return fieldName.includes(ci);
            });
            if(fieldHasIndentifier){
                //however here, we push the entire field name
                fieldsThatReferenceClasses.push(field);
            }
        });

        if(!fieldsThatReferenceClasses.length) return metadataTypesUsingClass;

        let searchValue = entryPoint.name;

        metadataTypesUsingClass = await mdTypeUtils.queryMetadataTypeForValue(connection,fieldsThatReferenceClasses,searchValue);

        return metadataTypesUsingClass;

    }   
}



module.exports = findReferences;