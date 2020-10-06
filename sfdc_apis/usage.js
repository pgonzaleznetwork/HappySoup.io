let toolingAPI = require('../sfdc_apis/tooling');
let utils = require('../services/utils');
let stats = require('../services/stats');
let format = require('../services/fileFormats');

function usageApi(connection,entryPoint,cache){

    let toolingApi = toolingAPI(connection);

    async function getUsage(){

        let query = usageQuery();
        await query.exec();

        let callers = query.getResults();
            
        callers = await enhanceData(callers);
        //sort alphabetically
        callers.sort((a,b) => (a.name > b.name) ? 1 : -1 );

        let files = format(entryPoint,callers,'usage');

        let csv = files.csv();
        let excel = files.excel();
        let packageXml = files.xml();

        let usageTree = createUsageTree(callers);
        let statsInfo = stats(callers);

        return{
            packageXml,
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
        let apexClasses = [];
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
            else if(type == 'APEXCLASS' && entryPoint.type == 'CustomField'){ 
                apexClasses.push(metadata);
            }
            else{
                otherMetadata.push(metadata);
            }
        });

        if(customFields.length){
            customFields = await addParentNamePrefix(customFields,'TableEnumOrId');
        }
        if(validationRules.length){
            /**
             * Only the version 33.0 of the tooling API supports the TableEnumOrId column on the ValidationRule object. On higher versions
             * only the EntityDefinitionId is available but this returns the 15 digit Id of the object, whereas everywhere else in the API
             * the 18 digit version is returned.
             * 
             * So here we force the API call to be made against the 33.0 version so that we can use the 18 digit TableEnumOrId
             */
            validationRules = await addParentNamePrefix(validationRules,'TableEnumOrId','33.0');
        }
        if(layouts.length){
            layouts = await addParentNamePrefix(layouts,'TableEnumOrId');
        }
        if(lookupFilters.length){
            lookupFilters = await getLookupFilterDetails(lookupFilters);
        }
        if(apexClasses.length){
            apexClasses = await getFieldUsageMode(apexClasses);
        }

        otherMetadata.push(...customFields);
        otherMetadata.push(...validationRules);
        otherMetadata.push(...layouts);
        otherMetadata.push(...lookupFilters);
        otherMetadata.push(...apexClasses);

        return otherMetadata;

    }

    /**
     * We know that the field is referenced in this class, but is it
     * used for reading or assignment? We determine that here by checking
     * if the field is used in an assignment expression in the body of the class
     */
    async function getFieldUsageMode(apexClasses){

        //i.e field_name__c without the object prefix
        let refCustomField = entryPoint.name.split('.')[1];

        /**
         * This matches on custom_field__c = but it does NOT match
         * on custom_field__c == because the latter is a boolean exp
         * and we are searching for assignment expressions
         * gi means global and case insensitive search
         */
        let assignmentExp = new RegExp(`${refCustomField}=(?!=)`,'gi');

        let ids = apexClasses.map(ac => ac.id);
        ids = utils.filterableId(ids);

        let query = `SELECT Id,Name,Body FROM ApexClass WHERE Id IN ('${ids}')`;
        let soqlQuery = {query,filterById:true};
    
        let results = await toolingApi.query(soqlQuery);

        let classBodyById = new Map();
    
        results.records.forEach(rec => {
            classBodyById.set(rec.Id,rec.Body);
        });

        
        apexClasses.forEach(ac => {

            //by default we assume that the mode is read only
            ac.fieldMode = 'read';

            let body = classBodyById.get(ac.id);
            if(body){
                //remove all white space/new lines
                body = body.replace(/\s/g,'');

                if(body.match(assignmentExp)){
                    ac.fieldMode = 'write';
                }
            }
        });

        return apexClasses;
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

        let soqlQuery = createParentIdQuery(Array.from(metadataRecordToEntityMap.keys()),'CustomField','DeveloperName');
        let results = await toolingApi.query(soqlQuery);

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

    async function addParentNamePrefix(metadataArray,parentIdField,apiVersionOverride){

        let {type} = metadataArray[0];
        let objectPrefixSeparator = (type.toUpperCase() == 'LAYOUT' ? '-' : '.');
        let ids = metadataArray.map(metadata => metadata.id);

        let soqlQuery = createParentIdQuery(ids,type,parentIdField);

        if(apiVersionOverride) soqlQuery.apiVersionOverride = apiVersionOverride;
        let results = await toolingApi.query(soqlQuery);

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
    
        let query = `SELECT Id, ${selectFields}
        FROM ${type} 
        WHERE Id IN ('${ids}') `;

        return {query,filterById:true};

    }

    
    
    function createUsageQuery(id){

        let query = `SELECT MetadataComponentId, MetadataComponentName,MetadataComponentType,MetadataComponentNamespace, RefMetadataComponentName, RefMetadataComponentType, RefMetadataComponentId,
        RefMetadataComponentNamespace 
        FROM MetadataComponentDependency 
        WHERE RefMetadataComponentId  = '${id}' ORDER BY MetadataComponentType`;

        return {query,filterById:true};

    }

    return {getUsage}
}

module.exports = usageApi;