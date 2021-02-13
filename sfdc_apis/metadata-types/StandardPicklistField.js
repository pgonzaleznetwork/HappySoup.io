let utils = require('../../services/utils');
let restAPI = require('../rest');


async function findReferences(connection,entryPoint,cache,options){

    async function searchFieldInApexClass(parentObjectName,fieldApiName,apexClasses){

        let fieldNameRegex = new RegExp(`${fieldApiName}`,'gi');
    
        let ids = apexClasses.map(ac => ac.id);
        ids = utils.filterableId(ids);
    
        let query = `SELECT Id,Name,Body FROM ApexClass WHERE Id IN ('${ids}')`;
        let soqlQuery = {query,filterById:true,useToolingApi:true};
    
        let rawResults  = await restApi.query(soqlQuery);
    
        let classBodyById = new Map();
    
        rawResults.records.forEach(rec => {
            classBodyById.set(rec.Id,rec.Body);
        });
    
        //console.log(classBodyById);
    
        let classesThatUseField = [];
        
        apexClasses.forEach(ac => {
    
            let body = classBodyById.get(ac.MetadataComponentId);
            if(body){
                //remove all white space/new lines
                body = body.replace(/\s/g,'');
    
                console.log('body',body);
    
                if(body.match(fieldNameRegex)){
                    console.log('MATCH');
                    classesThatUseField.push(ac);
                }
            }
        });
    }

    
    async function searchFieldInApexTrigger(apexTriggers){
        //something
    }

    let functionsByMetadataType = new Map();
    functionsByMetadataType.set('ApexClass',searchFieldInApexClass);
    functionsByMetadataType.set('ApexTrigger',searchFieldInApexTrigger);

    let metadataUsingField = [];

    let restApi = restAPI(connection);

    let standardPicklistName = entryPoint.id;
    let [parentObjectName,fieldApiName] = standardPicklistName.split('.');

    let metadataUsingObject = await queryDependeciesByObjectName(parentObjectName);

    let metadataByType = new Map();

    metadataUsingObject.forEach(metadata => {

        if(metadataByType.has(metadata.type)){
            metadataByType.get(metadata.type).push(metadata);
        }
        else{
            metadataByType.set(metadata.type,[]);
        }
    });

    for (let [metadataType, metadata] of metadataByType) {
        
        let callback = functionsByMetadataType.get(metadataType);
        if(callback){
            let results = callback(parentObjectName,fieldApiName,metadata);
            metadataUsingField.push(...results);
        }
    }

    
    console.log('classes!',classesThatUseField);

    rawResults.records = classesThatUseField;

    return rawResults;

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

    
    
    
    
}




module.exports = findReferences;