let utils = require('../../services/utils');
let restAPI = require('../rest');


async function findReferences(connection,entryPoint,cache,options){

    let metadataUsingField = [];

    let restApi = restAPI(connection);

    //let StandardFieldName = entryPoint.id;
    let [object,field] = entryPoint.name.split('.');

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

    for (let [metadataType, members] of metadataByType) {

        let codeBasedField = getCodeBasedField(metadataType);

        if(codeBasedField){

            let params = {
                object,
                field,
                codeBasedField,
                metadataType,
                members
            }

            let results = await searchFieldInCode(params);
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

    async function searchFieldInCode(params){

        let {field,codeBasedField,metadataType,members} = params;

        let fieldNameRegex = new RegExp(`${field}`,'gi');
    
        let ids = members.map(m => m.id);
        ids = utils.filterableId(ids);
    
        let query = `SELECT Id,Name,${codeBasedField},NamespacePrefix FROM ${metadataType} WHERE Id IN ('${ids}')`;
        let soqlQuery = {query,filterById:true,useToolingApi:true};
    
        let rawResults  = await restApi.query(soqlQuery);
    
        let metadataBodyById = new Map();
    
        rawResults.records.forEach(rec => {
            metadataBodyById.set(rec.Id,rec[codeBasedField]);
        });
        
        let metadataUsingField = [];
        
        members.forEach(member => {
    
            let body = metadataBodyById.get(member.id);
            if(body){
                //remove all white space/new lines
                body = body.replace(/\s/g,'');
        
                if(body.match(fieldNameRegex)){
                    metadataUsingField.push(member);
                }
            }
        });

        metadataUsingField = metadataUsingField.map(m => {
    
            let simplified = {
                name:m.name,
                type:metadataType,
                id: m.id,
                url:`${connection.url}/${m.id}`,
                notes:null,      
            }
    
            return simplified;          
        });

        //console.log(classesUsingField);

        return metadataUsingField;
    }

}

function getCodeBasedField(metadataType){

    let codeBasedFieldByMetadataType = new Map();
    codeBasedFieldByMetadataType.set('ApexClass','Body');
    codeBasedFieldByMetadataType.set('ApexTrigger','Body');
    codeBasedFieldByMetadataType.set('ApexPage','Markup');

    return codeBasedFieldByMetadataType.get(metadataType);
}




module.exports = findReferences;