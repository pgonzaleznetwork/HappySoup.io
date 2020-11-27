let restAPI = require('../rest');
const logError = require('../../services/logging');
let utils = require('../../services/utils');


async function findReferences(connection,entryPoint,cache,options){

    let references = [];
    let restApi = restAPI(connection);

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

    async function findMetadataTypeRecords(){

        let metadataTypesUsingClass = [];
        if(!options.classInMetadataTypes) return metadataTypesUsingClass;

        function parseMetadataTypeRecord(record){

            let simplified = {
                name: `${record.DeveloperName} (${record.attributes.type})`,
                type: 'Custom Metadata Record',
                id: record.Id,
                url:`${connection.url}/${record.Id}`,
                notes:null,       
            }
            return simplified;
        }

        let searchValue = entryPoint.name.toLowerCase();

        //we need to get all the objects in the org to find
        //out which ones are actually custom metadata types
        let sObjects = await restApi.getSObjectsDescribe();
        let customMetadataTypes = [];
        
        sObjects.forEach(sobj => {
            //metadata types end with __mdt
            if(sobj.name.includes('__mdt')){
                //when using it in queries though, we don't need the __mdt suffix
                let index = sobj.name.indexOf('__mdt');
                let name = sobj.name.substring(0,index);
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
            let query = `SELECT Id,DeveloperName FROM CustomObject WHERE DeveloperName  IN ('${filterNames}')`;
            let soql = {query,filterById:false,useToolingApi:true};
            let rawResults = await restApi.query(soql);

            let metadataTypesById = new Map();

            rawResults.records.map(obj => {
                metadataTypesById.set(obj.Id,obj.DeveloperName);
            });

            let filterTableOrEnumIds = utils.filterableId(Array.from(metadataTypesById.keys()));

            //now we query all the custom fields belonging to custom metadata types
            query = `SELECT Id,DeveloperName,TableEnumOrId FROM CustomField WHERE TableEnumOrId  IN ('${filterTableOrEnumIds}')`;
            soql = {query,filterById:false,useToolingApi:true};

            rawResults = await restApi.query(soql);

            let fullFieldNames = [];

            //once we have all the fields, we build their full name using the metadata type
            //id map. Ideally we would've queried the full name in the previous query but
            //the tooling API doesn't allow queries on the fullName if the query returns
            //more than one result
            rawResults.records.forEach(field => {
                let metadataTypeName = metadataTypesById.get(field.TableEnumOrId);
                metadataTypeName += '__mdt';
                let fullFieldName = `${metadataTypeName}.${field.DeveloperName}__c`;
                fullFieldNames.push(fullFieldName);
            });

            //now that we have the full names, we issue a readMetadata call to inspect the
            //details of each custom field
            //let customFieldsMetadata = await mdapi.readMetadata('CustomField',fullFieldNames);

            let fieldsThatReferenceClasses = [];
            let classIndentifiers = ['class','handler','type','instance'];

            fullFieldNames.forEach(field => {

                field = field.toLowerCase();

                let fieldHasIndentifier = classIndentifiers.some(ci => {
                    return field.includes(ci);
                });
                if(fieldHasIndentifier){
                    fieldsThatReferenceClasses.push(field);
                }
            })

            //now we have the objects and fields that point to a class
            //The next step is to query each individual object, checking if the field in question
            //matches the search value
            //to do that, we map the fields by the object name
            //note that a single metadata type can have multiple fields that point to field definitions
            let fieldsByObjectName = new Map();

            fieldsThatReferenceClasses.forEach(field => {

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
                    if(typeof record[key] === 'string' && record[key].toLowerCase() == searchValue){
                        metadataTypesUsingClass.push(parseMetadataTypeRecord(record));
                    }
                })
            })            
        }
        return metadataTypesUsingClass;

    }

    
}



module.exports = findReferences;