const toolingAPI = require('../sfdc_apis/tooling');
const metadataAPI = require('../sfdc_apis/metadata');
let packagexml = require('../services/packagexml');
let utils = require('../services/utils');
let stats = require('../services/stats');
const sheetFile = require('../services/sheetFile');

function usageApi(connection,entryPoint,cache){

    let toolingApi = toolingAPI(connection);

    async function getUsage(){

        let query = usageQuery();
        await query.exec();

        let callers = query.getResults();
            
        callers = await enhanceData(callers);
        //sort alphabetically
        callers.sort((a,b) => (a.name > b.name) ? 1 : -1 );

        let csv = sheetFile(entryPoint,callers,'usage','csv');
        let excel = sheetFile(entryPoint,callers,'usage','excel');
        let package = packagexml(entryPoint,callers,'usage');
        let usageTree = createUsageTree(callers);
        let statsInfo = stats(callers);

        return{
            package,
            usageTree,
            stats:statsInfo,
            entryPoint,
            csv,
            excel
        }    

    }

    function usageQuery(){

        let result = [];

        async function exec(){

            let soqlQuery = createUsageQuery(entryPoint.id);
            let rawResults = await toolingApi.query(soqlQuery);
            result = simplifyResults(rawResults);
        }

        return {
            exec,
            getResults(){
                return result;
            }
        }

    }

    async function enhanceData(metadataArray){

        let validationRules = [];
        let customFields = [];
        let layouts = [];
        let lookupFilters = [];
        let otherMetadata = [];

        metadataArray.forEach(metadata => {

            let {type} = metadata;
            type = type.toUpperCase();

            if(type == 'CUSTOMFIELD'){
                metadata.name += '__c';
                customFields.push(metadata);
            }
            else if(type == 'VALIDATIONRULE'){
                validationRules.push(metadata);
            }
            else if(type == 'LAYOUT'){ 
                layouts.push(metadata);
            }
            else if(type == 'LOOKUPFILTER'){ 
                lookupFilters.push(metadata);
            }
            else{
                otherMetadata.push(metadata);
            }
        });

        if(customFields.length){
            customFields = await addParentNamePrefix(customFields,'TableEnumOrId');
        }
        if(validationRules.length){
            validationRules = await addParentNamePrefix(validationRules,'EntityDefinitionId');
        }
        if(layouts.length){
            layouts = await addParentNamePrefix(layouts,'EntityDefinitionId');
        }
        if(lookupFilters.length){
            lookupFilters = await getLookupFilterDetails(lookupFilters);
        }

        otherMetadata.push(...customFields);
        otherMetadata.push(...validationRules);
        otherMetadata.push(...layouts);
        otherMetadata.push(...lookupFilters);

        return otherMetadata;

    }

    async function getLookupFilterDetails(lookupFilters){

        let metadataRecordToEntityMap = new Map();

        lookupFilters.forEach(lf => {

            /**lookup filters in the metadata component dependency are returned as nf_01I0O000000bSwQUAU_00N3Y00000GcJePUAV, where the first
            id is the object Id and the last one is the lookup field id.

            For standard objects, the format is Account_00N3Y00000GcJePUAV (i.e a 2 part string, as opposed to 3 parts for custom objects)
            */
            let parts = lf.name.split('_');

            let fieldId = parts[parts.length -1];
            let objectId = parts[parts.length -2];

            metadataRecordToEntityMap.set(fieldId,objectId);
            lf.id = fieldId;//point the id to the actual field id, as opposed to the internal lookup filter id
            lf.url = `${connection.url}/${fieldId}`;
        });

        let queryString = createParentIdQuery(Array.from(metadataRecordToEntityMap.keys()),'CustomField','DeveloperName');
        let results = await toolingApi.query(queryString);

        let developerNamesByFieldId = new Map();
    
        results.records.forEach(rec => {
            developerNamesByFieldId.set(rec.Id,rec.DeveloperName);
        });

        let objectNamesById = await utils.getObjectNamesById(connection,cache);

        lookupFilters.forEach(lf => {

            let fullName;

            let entityId = metadataRecordToEntityMap.get(lf.id);         
            let objectName = objectNamesById.get(entityId);
            let fieldName = developerNamesByFieldId.get(lf.id);
            fieldName += '__c';
        
            //object name is truthy only if the entityId corresponds to a custom object
            //for standard objects, the entityId is the actual object name i.e "Account"
            if(objectName){
                fullName = `${objectName}.${fieldName}`;
            }else{
                fullName = `${entityId}.${fieldName}`;
            }    

            lf.name = fullName;

        });

        return lookupFilters;

    }

    async function addParentNamePrefix(metadataArray,parentIdField){

        let {type} = metadataArray[0];
        let objectPrefixSeparator = (type.toUpperCase() == 'LAYOUT' ? '-' : '.');
        let ids = metadataArray.map(metadata => metadata.id);

        let queryString = createParentIdQuery(ids,type,parentIdField);
        let results = await toolingApi.query(queryString);

        let metadataRecordToEntityMap = new Map();
    
        results.records.forEach(rec => {
            metadataRecordToEntityMap.set(rec.Id,rec[parentIdField]);
        });

        let objectNamesById = await utils.getObjectNamesById(connection,cache);

        metadataArray.forEach(metadata => {

            let fullName;

            let entityId = metadataRecordToEntityMap.get(metadata.id);         
            let objectName = objectNamesById.get(entityId);
        
            //object name is truthy only if the entityId corresponds to a custom object
            //for standard objects, the entityId is the actual object name i.e "Account"
            if(objectName){
                fullName = `${objectName}${objectPrefixSeparator}${metadata.name}`;
            }else{
                fullName = `${entityId}${objectPrefixSeparator}${metadata.name}`;
            }    

            metadata.name = fullName;

        });

        return metadataArray;
    }

    function createUsageTree(callers){

        let tree = callers.reduce((result,caller) => {

            if(result[caller.type]){
                result[caller.type].push(caller);
            }
            else{
                result[caller.type] = [caller];
            }

            return result;

        },{});

        return tree;

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
    
    function createParentIdQuery(ids,type,selectFields){

        ids = utils.filterableId(ids);
    
        return `SELECT Id, ${selectFields}
        FROM ${type} 
        WHERE Id IN ('${ids}') ORDER BY EntityDefinitionId`;

    }

    
    
    function createUsageQuery(id){

        return `SELECT MetadataComponentId, MetadataComponentName,MetadataComponentType,MetadataComponentNamespace, RefMetadataComponentName, RefMetadataComponentType, RefMetadataComponentId,
        RefMetadataComponentNamespace 
        FROM MetadataComponentDependency 
        WHERE RefMetadataComponentId  = '${id}' ORDER BY MetadataComponentType`

    }

    return {getUsage}
}

module.exports = usageApi;