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
        
        callers = await enhanceCustomFieldData(callers);
        
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

    /**
     * The dependency data returned by the Tooling API does not provide enough information to know
     * what object a custom field belongs to, and whether that object is an actual custom object
     * or a custom metadata type. 
     * 
     * Here, with the aid of the metadata API, with add more detail to these dependencies. 
     */
    async function enhanceCustomFieldData(callers){

        //sort alphabetically
        callers.sort((a,b) => (a.name > b.name) ? 1 : -1 );
    
        let customFieldIds = [];
    
        callers.forEach(caller => {
    
            if(isCustomField(caller.type)){
                caller.name += '__c';
                customFieldIds.push(caller.id);
            }
        })
    
        if(customFieldIds.length){
    
            let objectNamesById = await getObjectNamesById();
            let objectIdsByCustomFieldId = await getObjectIds(customFieldIds);
    
            callers.forEach(caller => {
    
                if(isCustomField(caller.type)){
                    caller.name = getCorrectFieldName(caller.name,caller.id,objectIdsByCustomFieldId,objectNamesById);
                }
            });
            
        }
    
        return callers;
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
     * The correct field name is determined by looking at a map of objectId => fullName,
     * provided by the metadata API
     */
    function getCorrectFieldName(name,id,objectIdsByCustomFieldId,objectNamesById){
    
        let correctName;
    
        let entityId = objectIdsByCustomFieldId.get(id);         
        let objectName = objectNamesById.get(entityId);
        
    
        if(objectName){
            correctName = `${objectName}.${name}`;
        }else{
            correctName = `${entityId}.${name}`;
        }    
    
        return correctName;
    
    }
    
    function isCustomField(type){
        return (type.toUpperCase() === 'CUSTOMFIELD');
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
    
    /**
     * Because the tooling API doesn't return the object id of a custom field dependency 
     * we use the tooling API again to query the CustomField object, and get a map
     * of customFieldId to customObjectId
     */
    async function getObjectIds(customFieldIds){
    
        let queryString = createCustomFieldQuery(customFieldIds);
        let results = await toolingApi.query(queryString);
        let customFieldIdToEntityId = new Map();
    
        results.records.forEach(rec => {
            customFieldIdToEntityId.set(rec.Id,rec.TableEnumOrId);
        });
    
        return customFieldIdToEntityId;
        
    }
    
    
    function createCustomFieldQuery(customFieldIds){
    
        let ids = filterableId(customFieldIds);
    
        return `SELECT Id, TableEnumOrId 
        FROM CustomField 
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