let toolingAPI = require('../sfdc_apis/tooling');
let reportsAPI = require('../sfdc_apis/reports');
let utils = require('../services/utils');
let stats = require('../services/stats');
let format = require('../services/fileFormats');
const endpoints = require('./endpoints');

function usageApi(connection,entryPoint,cache){

    let toolingApi = toolingAPI(connection);

    async function getUsage(){

        let query = usageQuery(entryPoint);
        await query.exec();
        let callers = query.getResults();

        if(lacksDependencyApiSupport(entryPoint)){
            let additionalReferences = await seachAdditionalReferences(connection,entryPoint);
            callers.push(...additionalReferences);
        }
            
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

    function usageQuery(entryPoint){

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
        let reports = [];
        let otherMetadata = [];

        metadataArray.forEach(metadata => {

            //make sure every metadata item has a pills property that we can add values
            //to later
            metadata.pills = [];

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
            //for the following metadata types, we only need to enhance their data when the entry point is 
            //a custom field, this is because fields can be used by these metadata types in different ways
            //for example a field can be used in a report for its filter conditions or only for viewing 
            else if(entryPoint.type.toUpperCase() == 'CUSTOMFIELD'){
                if(type == 'APEXCLASS'){
                    apexClasses.push(metadata);
                }
                else if(type == 'REPORT'){
                    reports.push(metadata);
                }
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
            apexClasses = await getFieldInfoForClass(apexClasses);
        }
        if(reports.length){
            reports = await getFieldInfoForReport(reports);
        }

        otherMetadata.push(...customFields);
        otherMetadata.push(...validationRules);
        otherMetadata.push(...layouts);
        otherMetadata.push(...lookupFilters);
        otherMetadata.push(...apexClasses);
        otherMetadata.push(...reports);

        return otherMetadata;

    }

    /**
     * We know that the field is referenced in these reports, but is it
     * used for filtering conditions or just for visualization? We determine that here by 
     * checking the report metadata against the analytics API 
     */
    async function getFieldInfoForReport(reports){

        let reportsApi = reportsAPI(connection);

        let ids = reports.map(r => r.id);
        let reportsMetadata = await reportsApi.getReportsMetadata(ids);

        let reportsMetadataById = new Map();
    
        reportsMetadata.records.forEach(rep => {

            //when the data is accessible to the running user, the response comes 
            //as a single json object
            //if the report is in a private folder, the response comes in an array format
            if(!Array.isArray(rep)){
                reportsMetadataById.set(rep.attributes.reportId,rep);
            }
        });

        let fullFieldName = entryPoint.name;

        reports.forEach(report => {

            let reportMetadata = reportsMetadataById.get(report.id);

            if(reportMetadata){
                //if the report has groupings and one of the groupings uses the field in question
                if(reportMetadata.reportExtendedMetadata.groupingColumnInfo && reportMetadata.reportExtendedMetadata.groupingColumnInfo[fullFieldName]){
                    report.pills.push({label:'Grouping',color:getColor('red')});
                }

                //if the report has filters and uses the field as a filter criteria
                if(reportMetadata.reportMetadata.reportFilters){
                    reportMetadata.reportMetadata.reportFilters.forEach(filter => {
                        if(filter.column == fullFieldName){
                            report.pills.push({label:'Filter Condition',color:getColor('red')});
                        }
                    })
                }
            }
            else{
                //if there isn't a match here is because the response for this report
                //came in an array format, which means that the report is in a private folder
                //and its metadata is not available to the running user
                report.pills.push({label:'Unavailable - Report is in private folder',color:getColor()});
            }

            //if we reach this point and there are no pills on this report, it means that the report
            //is accessible, but the field in question is not used for filtering or grouping
            //it is only used for view
            if(report.pills.length < 1){
                report.pills.push({label:'View only',color:'green'});
            }
        });

        return reports;

    }

    /**
     * We know that the field is referenced in this class, but is it
     * used for reading or assignment? We determine that here by checking
     * if the field is used in an assignment expression in the body of the class
     */
    async function getFieldInfoForClass(apexClasses){

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

            let body = classBodyById.get(ac.id);
            if(body){
                //remove all white space/new lines
                body = body.replace(/\s/g,'');

                if(body.match(assignmentExp)){
                    ac.pills.push({label:'write',color:getColor('red')});
                }
                else{
                    ac.pills.push({label:'read',color:getColor('green')});
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

            //page layouts have a unique url that requires both the entitiy id and the layout id, so we take advantage
            //that we have already queried this data in this method and build the URL here
            //not the cleanest way but we save a whole roundtrip to the server
            if(type.toUpperCase() == 'LAYOUT'){
                metadata.url = `${connection.url}/layouteditor/layoutEditor.apexp?type=${entityId}&lid=${metadata.id}`;
            }

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

    /**
     * Some metadata types are not fully supported by the MetadataComponentDependency API
     * so we need to manually query related objects to find dependencies. An example of this is the
     * EmailTemplate object, which is when queried, does not return WorkflowAlerts that reference the template
     */
    function lacksDependencyApiSupport(entryPoint){
        return ['EmailTemplate'].includes(entryPoint.type);
    }

    async function seachAdditionalReferences(connection,entryPoint){

        let additionalReferences = [];

        if(entryPoint.type == 'EmailTemplate'){
            let findTemplateRefs =  require('./metadata-types/EmailTemplate');
            additionalReferences = await findTemplateRefs(connection,entryPoint);
        }

        return additionalReferences;

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

function getColor(color){

    //default grey color
    let hex = '#7f766c';

    if(color == 'red'){
        hex = '#d63031';
    }
    else if(color == 'green'){
        hex = '#3c9662';
    }
    
    return hex;
}



module.exports = usageApi;