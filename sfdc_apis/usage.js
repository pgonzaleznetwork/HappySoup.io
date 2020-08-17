const toolingAPI = require('../sfdc_apis/tooling');
const metadataAPI = require('../sfdc_apis/metadata');
let packagexml = require('../services/packagexml');
let stats = require('../services/stats');

function usageApi(connection,entryPoint,cache){

    let toolingApi = toolingAPI(connection);

    async function getUsage(){

        let query = usageQuery();
        await query.exec();

        let callers = query.getResults();
            
        callers = await enhanceData(callers);
        //sort alphabetically
        callers.sort((a,b) => (a.name > b.name) ? 1 : -1 );

        let package = packagexml(entryPoint,callers);
        let usageTree = createUsageTree(callers);
        let statsInfo = stats(callers);

        return{
            package,
            usageTree,
            stats:statsInfo,
            entryPoint
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

        otherMetadata.push(...customFields);
        otherMetadata.push(...validationRules);
        otherMetadata.push(...layouts);

        return otherMetadata;

    }

    async function addParentNamePrefix(metadataArray,parentIdField){

        let {type} = metadataArray[0];
        let ids = metadataArray.map(metadata => metadata.id);

        let queryString = createParentIdQuery(ids,type,parentIdField);
        let results = await toolingApi.query(queryString);

        let metadataRecordToEntityMap = new Map();
    
        results.records.forEach(rec => {
            metadataRecordToEntityMap.set(rec.Id,rec[parentIdField]);
        });

        let objectNamesById = await getObjectNamesById();

        metadataArray.forEach(metadata => {

            let fullName;

            let entityId = metadataRecordToEntityMap.get(metadata.id);         
            let objectName = objectNamesById.get(entityId);
        
    
            if(objectName){
                fullName = `${objectName}.${metadata.name}`;
            }else{
                fullName = `${entityId}.${metadata.name}`;
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
    
    /**
     * Uses the Metadata API to get a map of object Ids to object names
     */
    async function getObjectNamesById(){
        
        let objectsData = await getCustomObjectData();

        let objectsById = new Map();
        
        objectsData.forEach(obj => {
            if(obj.id != ''){
                objectsById.set(obj.id,obj.fullName);
            }
        })
    
        return objectsById;
    
    }
    
   
    async function getCustomObjectData(){

        let objectsData = [];

        //used the data in cache if it already exists
        if(cache.getCustomObjects().length){
            objectsData = [...cache.getCustomObjects()];
        }
        else{

            //call the api and cache the data for later use
            let mdapi = metadataAPI(connection);
            objectsData = await mdapi.listMetadata('CustomObject');

            objectsData = objectsData.map(obj => {
                let simplified = {
                    id:obj.id,
                    fullName:obj.fullName
                };
                return simplified;
            })
            cache.cacheCustomObjects(objectsData);
        }

        return objectsData;
    }
    
    function createParentIdQuery(ids,type,parentIdField){

        ids = filterableId(ids);
    
        return `SELECT Id, ${parentIdField} 
        FROM ${type} 
        WHERE Id IN ('${ids}') ORDER BY EntityDefinitionId`;

    }
    
    /**
     * Takes a list of ids or a single id as a string and formats them in a way that can be used in 
     * SOQL query filters
     */
    function filterableId(metadataId){
    
        let ids = '';
    
        //allows for the query to filter by either a single id or multiple ids
        if(Array.isArray(metadataId)){
    
            metadataId.forEach(id => {
                ids += "'"+id+"',"
            })
            //remove the first and last ' (and the last comma) as these are included in the query string 
            ids = ids.substring(1,ids.length-2);
        }else{
            ids = metadataId;
        }
    
        return ids;
    
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