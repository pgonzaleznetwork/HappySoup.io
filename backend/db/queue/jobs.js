let redisOps = require('../redisOps');

let {metadataAPI,restAPI} = require('sfdc-happy-api')();
let sessionValidation = require('../../services/sessionValidation');
let {cacheApi} = require('../caching')
let {ErrorHandler} = require('../../services/errorHandling');
let logError = require('../../services/logging');
const sfdcSoup = require('sfdc-soup');
let getUsageMetrics = require('sfdc-field-utilization');
const bulkDependency = require('sfdc-dependency-api-bulk')

async function listMetadataJob(job){

    let {sessionId,mdtype} = job.data;
    let session = await getSession(sessionId);

    let results = [];

    if(mdtype == 'StandardField'){
      results.push(...getStandardFields());
    }

    else if(shouldUseToolingApi(mdtype)){

      let restApi = restAPI(sessionValidation.getConnection(session),logError);

      let query = `SELECT Id,Name,NamespacePrefix FROM ${mdtype}`;
      let soqlQuery = {query,filterById:false,useToolingApi:true};
  
      let jsonResponse = await restApi.query(soqlQuery);

      if(!jsonResponse){
        let responseString = JSON.stringify(jsonResponse);
        logError(`Tooling API call failed`,{soqlQuery,responseString});
        throw new ErrorHandler(404,`Fault response from Tooling API query: ${responseString}`,'Fault response from listMetadata()'); 
      }
  
      //the response from the tooling api always returns a records array even if it's empty
      //so this operation is safe
      results = jsonResponse.records.map(record => {

        if(record.NamespacePrefix){
          record.Name = `${record.NamespacePrefix}.${record.Name}`;
        }

        return {
          name:record.Name,
          id:record.Id
        }
      });
    }
    //for any other metadata type, we use the Metadata API
    else {
      let mdapi = metadataAPI(sessionValidation.getConnection(session),logError);
      let jsonResponse = await mdapi.listMetadata(mdtype);

      if(jsonResponse){
        //if multiple items are returned the response comes in array form
        if(Array.isArray(jsonResponse)){
          results = jsonResponse.map(record => {
           
            return {
              name:record.fullName,
              id:record.id || record.fullName//standard objects use their name as the id
            }
          });
        }
        else{
          //single item is returned as an object.
          results.push({name:jsonResponse.fullName,id:jsonResponse.id});
        }
      }      
    }

    let cache = cacheApi(session.cache);
    let cacheKey = `list-${mdtype}`;

    cache.cacheMetadataList(cacheKey,results);

    return {
      newCache:session.cache,
      response:results
    }
  }
    

async function usageJob(job){

    let {entryPoint,sessionId} = job.data;
    let session = await getSession(sessionId);

    let cache = cacheApi(session.cache);
    let connection = sessionValidation.getConnection(session);

    let soupApi = sfdcSoup(connection,entryPoint,cache);
    let response = await soupApi.getUsage();

    if(entryPoint.options.fieldUtilization){

      try {
        response.utilization = await getUsageMetrics(connection,entryPoint.name);
      } catch (error) {
        response.utilization = {
          error
        }
      }
    }

    //supported for nested impact analysis
    //in which we only need the tree details
    if(entryPoint.options.treeOnly){
      let {usageTree} = response;
      response = usageTree;
    }

    return {
      newCache:session.cache,
      response
    }
  }

async function bulkUsageJob(job){

  let {ids,sessionId} = job.data;
  let session = await getSession(sessionId);

  let connection = sessionValidation.getConnection(session);

  let response = await bulkDependency.getUsage(ids,connection);

  return {
    response
  }

}

async function boundaryJob(job){

    let {entryPoint,sessionId} = job.data;
    let session = await getSession(sessionId);

    let cache = cacheApi(session.cache);
    let connection = sessionValidation.getConnection(session);

    let soupApi = sfdcSoup(connection,entryPoint,cache);
    let response = await soupApi.getDependencies();
 
    return {
      newCache:session.cache,
      response
    }
}

function getIdentityKey(session){
  return `${session.identity.orgId}.${session.identity.userId}`;
}


async function getSession(sessionId){

    let result = await redisOps.redisGet(sessionId);
    let session = JSON.parse(result);
    return session;
}

/**
* Retrieving ApexClass names with the listMetadata() call of the Metadata API is very very slow
* so for this specific metadata type, we use the Tooling API with the queryMore() call to be able to query
* the members in batches, which results in much better performance 
*
* On the other hand, email templates cannot be queried with listMetadata() unless you specify
* the folder name (which is a pain) so we fallback to the tooling api
*/
function shouldUseToolingApi(type){

  let types = ['ApexClass','EmailTemplate'];

  return types.includes(type);

}

function getStandardFields(){

  let allFields = [];
  let fieldsByObject = new Map();

  fieldsByObject.set('Opportunity',[
    'StageName',
    'Amount',
    'CloseDate',
    'IsClosed',
    'ForecastCategory',
    'HasOpportunityLineItem',
    'Type',
    'Probability',
    'IsWon',
    'LeadSource',
    ...getCommonFields()
  ]);
  
  fieldsByObject.set('Account',[
    'Industry',
    'AccountNumber',
    'AnnualRevenue',
    'IsPersonAccount',
    'Type',
    ...getAddressFields('Billing'),
    ...getAddressFields('Shipping'),
    ...getCommonFields()
  ]);

  fieldsByObject.set('Case',[
    'ClosedDate',
    'Origin',
    'Priority',
    'Status',
    'Type',
    'Reason',
    'Subject',
    'ContactPhone',
    ...getCommonFields()
  ]);

  fieldsByObject.set('Contact',[
    'Birthdate',
    'LeadSource',
    ...getAddressFields('Mailing'),
    ...getCommonFields()
  ]);

  fieldsByObject.set('Lead', [
    'LeadSource',
    'Industry',
    'Status',
    ...getAddressFields(''),
    ...getCommonFields()
  ]);

  fieldsByObject.set('Product2', [
    'Family',
    'Description',
    'ProductCode',
    'QuantityUnitOfMeasure'
  ]);

  fieldsByObject.set('Campaign', [
    'Status',
    'Type',
    'IsActive',
    'StartDate',
    'EndDate'
  ]);

  fieldsByObject.set('Order', [
    'Status',
    'Type',
    'ActivatedDate',
    'EffectiveDate',
    'EndDate'
  ]);

  fieldsByObject.set('OrderItem', [
    'Quantity',
    'Type',
    'EndDate'
  ]);

  for (let [object, fields] of fieldsByObject) {
    
    fields.forEach(field => {
      let fullName = `${object}.${field}`;
      let fieldObj = {name:fullName,id:fullName};
      allFields.push(fieldObj);
    })

  }

  return allFields;


}

function getCommonFields(){
  return ['RecordType','Owner'];
}

function getAddressFields(prefix){

  fields =  [
    'Accuracy',
    'Address',
    'City',
    'Country',
    'CountryCode',
    'State',
    'StateCode',
    'Street',
    'PostalCode',
    'Longitude',
    'Latitude',
  ]

  fields = fields.map(field => `${prefix}${field}`);

  return fields;
}

module.exports = {boundaryJob,usageJob,listMetadataJob,bulkUsageJob};