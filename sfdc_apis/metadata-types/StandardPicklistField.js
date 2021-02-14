let utils = require('../../services/utils');
let restAPI = require('../rest');


async function findReferences(connection,entryPoint,cache,options){

    let metadataUsingField = [];

    let restApi = restAPI(connection);

    let standardPicklistName = entryPoint.id;
    let [object,field] = standardPicklistName.split('.');

    let metadataUsingObject = await queryDependeciesByObjectName(object);

    let metadataByType = new Map();

    metadataUsingObject.forEach(metadata => {

        if(metadataByType.has(metadata.type)){
            metadataByType.get(metadata.type).push(metadata);
        }
        else{
            metadataByType.set(metadata.type,[]);
        }
    });

    let functionsByMetadataType = getFunctionsByMetadataType();

    for (let [metadataType, metadata] of metadataByType) {
        
        let callback = functionsByMetadataType.get(metadataType);

        if(callback){

            let params = {
                object,
                field,
                metadata,
            }

            let results = await callback(params);
            metadataUsingField.push(...results);
        }    
    }

    return metadataUsingField;


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

    async function searchFieldInApexClass({object,field,metadata}){

        let apexClasses = metadata;

        let fieldNameRegex = new RegExp(`${field}`,'gi');
    
        let ids = apexClasses.map(ac => ac.id);
        ids = utils.filterableId(ids);
    
        let query = `SELECT Id,Name,Body,NamespacePrefix FROM ApexClass WHERE Id IN ('${ids}')`;
        let soqlQuery = {query,filterById:true,useToolingApi:true};
    
        let rawResults  = await restApi.query(soqlQuery);
    
        let classBodyById = new Map();
    
        rawResults.records.forEach(rec => {
            classBodyById.set(rec.Id,rec.Body);
        });
        
        let classesUsingField = [];
        
        apexClasses.forEach(ac => {
    
            let body = classBodyById.get(ac.id);
            if(body){
                //remove all white space/new lines
                body = body.replace(/\s/g,'');
        
                if(body.match(fieldNameRegex)){
                    classesUsingField.push(ac);
                }
            }
        });

        classesUsingField = classesUsingField.map(ac => {
    
            let simplified = {
                name:ac.name,
                type:'ApexClass',
                id: ac.id,
                url:`${connection.url}/${ac.id}`,
                notes:null,      
            }
    
            return simplified;          
        });

        //console.log(classesUsingField);

        return classesUsingField;
    }

    
    async function searchFieldInApexTrigger(apexTriggers){
        //something
    }

    function getFunctionsByMetadataType(){

        let functionsByMetadataType = new Map();
        functionsByMetadataType.set('ApexClass',searchFieldInApexClass);
       // functionsByMetadataType.set('ApexTrigger',searchFieldInApexTrigger);

        return functionsByMetadataType;
    }
   
}




module.exports = findReferences;