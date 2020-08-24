let toolingAPI = require('./tooling');
let metadataAPI = require('./metadata');
require('dotenv').config();
let stats = require('../services/stats');
let utils = require('../services/utils');
let format = require('../services/fileFormats');


function dependencyApi(connection,entryPoint,cache){

    let toolingApi = toolingAPI(connection);

    async function getDependencies(){

        let query = recursiveDependencyQuery();

        await query.exec(entryPoint.id);

        let dependencies = query.getResults(); 

        dependencies = await enhanceCustomFieldData(dependencies);

        let unsupportedDependencies = await createUnsupportedDependencies(dependencies);

        dependencies.push(...unsupportedDependencies);

        let files = format(entryPoint,dependencies,'deps');

        let csv = files.csv();
        let excel = files.excel();
        let packageXml = files.xml();

        let dependencyTree = createDependecyTree(dependencies);
        let statsInfo = stats(dependencies);

        return{
            packageXml,
            dependencyTree,
            stats:statsInfo,
            entryPoint,
            csv,
            excel
        }        
    }

    function createDependecyTree(dependencies){

        let tree = initTree(dependencies);
        tree = reorderNodes(tree);
        let root = getRootNode(tree);
    
        return root;
    
    }
    
    /** 
    * A reducer is used to create an object based on all the raw dependencies. This object will represent
    * the hierarchy/tree of dependencies (i.e this class references this field, and this field references x, etc).
    *
    * The nodes of the tree are created by looking at the "referencedBy" property of each raw dependency object.
    * This means that, in a way, the nodes are created backwards, i.e looking at each dependency object and inspecting
    * who it was referenced by, and we use that "referenced by" to create a parent node. 
    *  
    * Within each node, the dependencies are sorted by their metadata type.
    *
    */
    function initTree(dependencies){
    
        let dependencyTree = dependencies.reduce((tree,dep) => {
    
            let newNodeKey = dep.referencedBy.name;
        
            //if the tree doesn't yet have a node for this key
            if(!tree[newNodeKey]){
                //we create a new node
                tree[newNodeKey] = {
                    references : {
                        [dep.type] : [dep]//within each node, the references are stored in arrays, where the arrays can be accessed by
                        //their metadata type name (i.e CustomField => [field1,field2])
                    },
                    //refNames is used to keep a list of the metadata that this node references
                    //this is later used in the reorderNodes() method to move the nodes below
                    //their respective parents
                    refNames:[dep.name]
                }
    
            }else{//if the tree already has a node for this key

                //we check if it already has a property
                //for this particular metadata type 
                if(tree[newNodeKey].references[dep.type]){
    
                    //since the node does have a property for this metadata type
                    //we add the dependency into the array for that metadata type only if it doesn't exist already
    
                    let listOfReferencedNames = tree[newNodeKey].references[dep.type].map(dep => dep.name);
    
                    if(listOfReferencedNames.indexOf(dep.name) == -1){
                        tree[newNodeKey].references[dep.type].push(dep);
                    }
                }
                else{// if the tree has a node for this key, but it doesn't yet have a property for this metadata type
                    //we add it here
                    //and push the dependency onto the related array
                    tree[newNodeKey].references[dep.type] = [dep];
                }
                
                tree[newNodeKey].refNames.push(dep.name);
            }
    
            return tree;
    
        },{});

        return dependencyTree;
    }
    
    
     /**
     * For each node, we need to inspect all other nodes to see if the current node is in the "refNames" array of any other node.
     * This is because a single node, can be referenced by N parent nodes (i.e a custom field being referenced by multiple classes
     * in the hiearchy).
     * 
     * If we find that a given node is referenced by another node and that node is not repeated (i.e we haven't alread shown the dependencies for that node)
     * we add the current node to the "references" array of the referencing node. 
     * 
     * Repated nodes represent nodes that have already been placed somewhere in the tree. What this means
     * is that if ClassA references 20 fields, we only shows ClassA and all its fields once in the tree.
     * If ClassA is referenced again somewhere later in the tree, we don't show its dependencies all over again. 
     * 
     * The keys of the tree object correspond to metadata names i.e myField__c or myApexClass
     */
    function reorderNodes(tree){
    
        for (currentNodeKey in tree) {
    
            let currentNode = tree[currentNodeKey];
            
            for(anyNodeKey in tree){
    
                let anyNode = tree[anyNodeKey];
    
                let anyNodeReferencesCurrentNode = (anyNode.refNames.indexOf(currentNodeKey) != -1);
    
                if(anyNodeReferencesCurrentNode){
    
                    for (metadataType in anyNode.references) {
                        
                        let typeReferences = anyNode.references[metadataType];
                        typeReferences.forEach(ref => {
    
                            if(ref.name.toUpperCase() == currentNodeKey.toUpperCase() && !ref.repeated){               
                                ref.references = currentNode.references;
                            }
                        })
    
                    }
                }
            }       
        }
    
        return tree;
    }
    
    /**
     * The tree returned by reorderNodes() still has the child nodes as properties of the main object. 
     * Here we discard those as we only care about the top level node
     */
    function getRootNode(tree){
    
        let root = {};
    
        //the root node is the first key in the tree, we discard the rest
        for (const key in tree) {
            root[key] = tree[key];
            break;
        }
    
        for (const key in root) {
            cleanReferences(root[key].references);
            delete root[key].refNames;
        }
    
        for (const key in root) {
            sortTypesAlphabetically(root[key].references);
        }
    
        return root;
    
    }
    
    /**
     * Each node has a referencedBy property, which was only needed to build the tree in 
     * initTree() and reorderNodes(). Since the tree is ordered at this point
     * we can discard these properties
     */

    let iter = 0;

    function cleanReferences(references){
        iter++;
    
        for (metadataType in references) {
                        
            let typeReferences = references[metadataType];
    
            typeReferences.forEach(ref => {
                delete ref.referencedBy;
                if(ref.references){
                    //prevents a stack overflow error
                    setTimeout(() => {
                        cleanReferences(ref.references);
                    }, 0);    
                }
            })
        }
    }
    
     
    /**
     * Recursively sort the references by their name. This allows custom fields of the same object type
     * to be displayed next to each other. 
     */
    function sortTypesAlphabetically(references){
    
        for (metadataType in references) {
                        
            let typeReferences = references[metadataType];
            typeReferences.sort((a,b) => (a.name > b.name) ? 1 : -1);
    
            typeReferences.forEach(ref => {
                if(ref.references){
                    //prevents a stack overflow error
                    setTimeout(() => {
                        sortTypesAlphabetically(ref.references);
                    }, 0);
  
                }
            })
        }
        
    }
    
    /**
     * Returns an object (with a closure) that allows the client code to recursively query all the forward 
     * dependencies of a given metadata id.
     */
    function recursiveDependencyQuery(){

        let result = [];
        let idsAlreadyQueried = [];
    
        /**
         * Executes the query using the tooling API. If the metadata id has dependencies, it calls itself
         * again, while continuting to push the dependencies to the result[] variable
         * @param {*} ids the ids to query metadata dependencies for 
         */
        async function exec(ids){
    
            if(Array.isArray(ids)){
                idsAlreadyQueried.push(...ids);
            }else{
                idsAlreadyQueried.push(ids);
            }
    
            let soqlQuery = createDependencyQuery(ids);    

            let rawResults = await toolingApi.query(soqlQuery);
            let dependencies = simplifyResults(rawResults);
    
            /**
             * This is the the ids of the returned dependencies, for which we want to query dependencies one level down
             * For example ClassA > Field1
             * Field1.Id is one of the ids that we want to check dependencies for
             * We don't necessarily want to check dependencies for every returned dependency.
             * 
             * This is because if a dependency has already been queried, we don't want to query it again and add its 
             * references under yet another node in the hierarchy/tree. This also prevents an infinite loop when classes or fields
             * have circular references (i.e ClassA > ClassB > ClassA ...infinity)
             */
            let nextLevelIds = [];
            
            dependencies.forEach(dep => {
    
                let alreadyQueried = (idsAlreadyQueried.indexOf(dep.id) != -1);
    
                /**
                 * Whether the id has already been queried or not, we still want to show this node
                 * on the tree, this allows circular references to be display at max one level down
                 */
                result.push(dep);
    
                if(alreadyQueried){
                    /**
                     * if it's been queried already, we mark is as repeated and we dont add it to the list of ids
                     * to query one level down
                     */
                    dep.repeated = true;
                }
                else{
                    /**
                     * if it's not been queried already, then we now it's safe to query it for dependencies
                     */
                    nextLevelIds.push(dep.id);
                }
    
            });
    
            if(nextLevelIds.length){
                await exec(nextLevelIds);            
            }
        }
    
        return {
            exec:exec,
            getResults(){
                return result;
            }
        }
    }
    
    
    /**
     * The metadata dependencies returned by the tooling API have a format that is difficult to work with specially
     * because of the very long and similar property names.
     * 
     * Here the dependency objects are simplified and we remove those that we don't care about. We also add a few
     * additional properties that will be used later. 
     * 
     */
    function simplifyResults(rawDependencies){
    
        let dependencies = rawDependencies.records.map(dep => {
    
                let simplified = {
                    name:dep.RefMetadataComponentName,
                    type:dep.RefMetadataComponentType,
                    id:dep.RefMetadataComponentId,
                    repeated:false,
                    url:`${connection.url}/${dep.RefMetadataComponentId}`,
                    notes:null,
                    namespace: dep.RefMetadataComponentNamespace,
                    referencedBy:{
                        name:dep.MetadataComponentName,
                        id:dep.MetadataComponentId,
                        type:dep.MetadataComponentType
                    }        
                }
    
                return simplified;          
            });
    
           dependencies.forEach(dep => {
    
                if(utils.isDynamicReference(dep)){
                    dep.nots = process.env.dynamicRefNote;
                    dep.url = connection.url;
                }
           })
    
            //we don't care about standard entities as they are available in any org
            dependencies = dependencies.filter(dep => {
    
                let entitiesToExclude = ['StandardEntity'];
                return entitiesToExclude.indexOf(dep.type) == -1;
            });
    
            return dependencies;
    
    }
    
    /**
     * The dependency data returned by the Tooling API does not provide enough information to know
     * what object a custom field belongs to, and whether that object is an actual custom object
     * or a custom metadata type. 
     * 
     * Here, with the aid of the metadata API, with add more detail to these dependencies. 
     */
    async function enhanceCustomFieldData(dependencies){
    
        let customFieldIds = [];
    
        dependencies.forEach(dep => {
    
            if(isCustomField(dep.type)){
                dep.name += '__c';
                customFieldIds.push(dep.id);
            }
            if(isCustomField(dep.referencedBy.type)){
                dep.referencedBy.name += '__c';
                customFieldIds.push(dep.referencedBy.id);
            }
        })
    
        if(customFieldIds.length){
    
            let objectNamesById = await utils.getObjectNamesById(connection,cache);
            let objectIdsByCustomFieldId = await getFieldToEntityMap(customFieldIds);
    
            dependencies.forEach(dep => {
    
                if(isCustomField(dep.type)){
                    dep.name = getCorrectFieldName(dep.name,dep.id,objectIdsByCustomFieldId,objectNamesById);
                }
    
                if(isCustomObject(dep.type)){
           
                    let objectName = objectNamesById.get(dep.id);        
                    if(objectName) dep.name = objectName;
                }
    
                if(isCustomField(dep.referencedBy.type)){
                    dep.referencedBy.name = getCorrectFieldName(dep.referencedBy.name,dep.referencedBy.id,objectIdsByCustomFieldId,objectNamesById);
                }
    
                if(isCustomObject(dep.referencedBy.type)){  
                    let objectName = objectNamesById.get(dep.referencedBy.id);   
                    if(objectName) dep.referencedBy.name = objectName;
                }
            });
            
        }
    
        return dependencies;
    }

     /**
     * The MetadataComponentDependency API does not return related objects as dependencies of lookup fields or global value
     * sets as dependencies of picklist fields.
     * 
     * For example if Account.To_Custom__c is a lookup to Custom_Object__c, Custom_Object__c is not returned as a dependency
     * which is obviously wrong. 
     * 
     * Here we identify which dependencies are custom fields, and with the aid of the metadata API, we determine which
     * ones are lookup fields and value sets. Then we "manually" create a dependency record for it. 
     * We don't create dependencies for lookups pointing to standard objects, because we assume those will exist in any org. 
     */
    async function createUnsupportedDependencies(dependencies){

        let newDependencies = [];
        let customFieldsByName = new Map();

        dependencies.forEach(dep => {
            if(isCustomField(dep.type)) customFieldsByName.set(dep.name,dep)
        });

        let customFieldNames = [...customFieldsByName.keys()];
        let cachedFields = [];
        let uncachedFields = [];

        //we look at the cache to figure out for which fields we have already
        //read the metadata from
        if(cache.getFieldNames().length){

            customFieldNames.forEach(field => {

                if(cache.isFieldCached(field)) cachedFields.push(field);
                else uncachedFields.push(field);
            })

        }else{
            uncachedFields = customFieldNames;
        }

        let records = [];

        if(uncachedFields.length){
            let mdapi = metadataAPI(connection);
            records = await mdapi.readMetadata('CustomField',uncachedFields);
            cache.cacheFieldNames(uncachedFields);
        }

        //we add the newly returned records to the cache for later use
        records.forEach(record => {
            cache.cacheField(record.fullName,record);
        })


        //for any field that we determined was cached, we add its data to the
        //records array
        cachedFields.forEach(field => {
            cachedFieldData = cache.getField(field);
            if(cachedFieldData) {
                records.push(cachedFieldData);
            }
        })

        let lookupFields = records.filter(rec => rec.referenceTo);
        let pkValueSets = records.filter(rec => rec.valueSet && rec.valueSet.valueSetName);

        if(lookupFields.length){
            let lookupFieldsDependencies = await createLookupFieldDependencies(lookupFields,customFieldsByName);
            newDependencies.push(...lookupFieldsDependencies);
        }

        if(pkValueSets.length){
            let valueSetDependencies = createValueSetDependencies(pkValueSets,customFieldsByName);
            newDependencies.push(...valueSetDependencies);
        }

        return newDependencies;

    }

    async function createLookupFieldDependencies(lookupFields,customFieldsByName){

        let lookupFieldsDependencies = [];

        let lookupFieldsByName = new Map();
        lookupFields.forEach(lf => lookupFieldsByName.set(lf.fullName,lf));

        let customObjectIdsByName = await utils.getObjectIdsByName(connection,cache);
    
        for (let fieldName of customFieldsByName.keys()){
    
            if(lookupFieldsByName.has(fieldName)){
    
                let fieldDescribe = lookupFieldsByName.get(fieldName);
                let relatedObjectName = fieldDescribe.referenceTo;
                let relatedObjectId = customObjectIdsByName.get(relatedObjectName);
    
                if(relatedObjectName && relatedObjectId){
    
                    let newDep = {
                        name:relatedObjectName,
                        type:'CustomObject',
                        id:relatedObjectId,
                        repeated:false,
                        url:`${connection.url}/${relatedObjectId}`,
                        notes:null,
                        namespace: null,
                        referencedBy:{
                            name:fieldName,
                            type:'CustomField'
                        }     
                    };
    
                    lookupFieldsDependencies.push(newDep);
    
                }
            }
    
        }
    
        return lookupFieldsDependencies;

    }

    function createValueSetDependencies(pkValueSets,customFieldsByName){

        let valueSetsByName = new Map();
        pkValueSets.forEach(vs => valueSetsByName.set(vs.fullName,vs));

        let valueSetDependencies = [];

        for (let fieldName of customFieldsByName.keys()){
    
            if(valueSetsByName.has(fieldName)){

                let valueSetInfo = valueSetsByName.get(fieldName);

                let newDep = {
                    name:valueSetInfo.valueSet.valueSetName,
                    type:'GlobalValueSet',
                    id:null,
                    repeated:false,
                    url:connection.url,
                    notes:null,
                    namespace: null,
                    referencedBy:{
                        name:fieldName,
                        type:'CustomField'
                    }     
                };

                valueSetDependencies.push(newDep);                

            }
        }

        return valueSetDependencies;

    }
    
    
    /**
     * The correct field name is determined by looking at a map of objectId => fullName,
     * provided by the metadata API
     */
    function getCorrectFieldName(name,id,objectIdsByCustomFieldId,objectNamesById){
    
        let correctName;
    
        let entityId = objectIdsByCustomFieldId.get(id);         
        let objectName = objectNamesById.get(entityId);
        
        //object name is truthy only if the entityId corresponds to a custom object
        //for standard objects, the entityId is the actual object name i.e "Account"
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
    
    function isCustomObject(type){
        return (type.toUpperCase() === 'CUSTOMOBJECT');
    }
        
   

    /**
     * Because the tooling API doesn't return the object id of a custom field dependency 
     * we use the tooling API again to query the CustomField object, and get a map
     * of customFieldId to customObjectId
     */
    async function getFieldToEntityMap(customFieldIds){
    
        let queryString = createCustomFieldQuery(customFieldIds);
        
        let results = await toolingApi.query(queryString);
        let customFieldIdToEntityId = new Map();
    
        results.records.forEach(rec => {
            customFieldIdToEntityId.set(rec.Id,rec.TableEnumOrId);
        });
    
        return customFieldIdToEntityId;
        
    }
    
    
    function createCustomFieldQuery(customFieldIds){
    
        let ids = utils.filterableId(customFieldIds);
    
        return `SELECT Id, TableEnumOrId 
        FROM CustomField 
        WHERE Id IN ('${ids}') ORDER BY EntityDefinitionId`;
    }
    
    
    /**
     * Returnes the raw SOQL query to pass to the tooling API
     */
    function createDependencyQuery(metadataId){
    
        let ids = utils.filterableId(metadataId);
        
        return `SELECT MetadataComponentId, MetadataComponentName,MetadataComponentType ,RefMetadataComponentName, RefMetadataComponentType, RefMetadataComponentId,
        RefMetadataComponentNamespace 
        FROM MetadataComponentDependency 
        WHERE MetadataComponentId IN ('${ids}') AND MetadataComponentType != 'FlexiPage' ORDER BY MetadataComponentName, RefMetadataComponentType`;
    }
    
    //api returned to the client code
    return {
        getDependencies
    }
    
}

module.exports = dependencyApi;