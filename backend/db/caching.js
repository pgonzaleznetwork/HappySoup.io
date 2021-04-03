
/**
 * Inits the cache which will be stored as an attribute of the session object, which is stored in redis. This is 
 * initialized in the oAuthRouter, once a session with salesforce has been stablished. 
 */
function initCache(){

    let cache = {
        orgMetadata : {
            fields:{},
            fieldNames:[],
            customObjects:[],
            workflowRules:{},
        },
        dependencies:{},
        usage:{},
        metadataList:{}
    }

    return cache;
}

function cacheApi(cache){

    function cacheDependency(key,value){
        cache.dependencies[key] = value;
    }
    
    function getDependency(key){
        return cache.dependencies[key];
    }

    function cacheUsage(key,value){
        cache.usage[key] = value;
    }
    
    function getUsage(key){
        return cache.usage[key];
    }
    
    function cacheMetadataList(key,value){
        cache.metadataList[key] = value;
    }
    
    function getMetadataList(key){
        return cache.metadataList[key];
    }
    
    function cacheCustomObjects(value){
        cache.orgMetadata.customObjects = [...value];
    }
    
    function getCustomObjects(){
        return cache.orgMetadata.customObjects;
    }

    function cacheWorkflowRules(objectType,data){
        cache.orgMetadata.workflowRules[objectType] = data;
    }

    function getWorkflowRules(objectType){
        if(cache.orgMetadata.workflowRules[objectType]){
            return cache.orgMetadata.workflowRules[objectType];
        }

        return null;
    }
    
    function isFieldCached(field){
        if(cache.orgMetadata.fieldNames.indexOf(field) == -1){
            return false;
        }
        return true;
    }
    
    function cacheFieldNames(fieldNames){
        cache.orgMetadata.fieldNames.push(...fieldNames);
    }
    
    function getFieldNames(){
        return cache.orgMetadata.fieldNames;
    }
    
    function cacheField(key,value){
        cache.orgMetadata.fields[key] = value;
    }
    
    function getField(key){
        return cache.orgMetadata.fields[key];
    }

    return {initCache,cacheDependency,getDependency,cacheMetadataList,getMetadataList,
        cacheCustomObjects,getCustomObjects,isFieldCached,cacheFieldNames,getFieldNames,cacheField,getField,
    cacheUsage,getUsage,cacheWorkflowRules,getWorkflowRules};

}



module.exports = {initCache,cacheApi};