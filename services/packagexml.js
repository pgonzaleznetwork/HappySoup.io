let utils = require('./utils');
require('dotenv').config();

/**
 * Creates an xml string following the standards of the salesforce package.xml files
 * used for metadata deployments. 
 */
function createPackageXml(entryPoint,dependencies,type){

    let depsByType = new Map();

    if(type === 'deps'){
        //when we look at what a metadata depends on, we don't need to include dynamic references
        //we do need them when the type is "usage"
        dependencies = dependencies.filter(dep => !utils.isDynamicReference(dep));
    }

    dependencies = dependencies.map(dep => {
        return {...dep};//return new version to prevent side effects in under functions later
    })

    //for metadata retrieval and deployment, lookup filters are considered custom fields, so we "fix" the type here
    dependencies.forEach(dep => {
        if(dep.type.toUpperCase() == 'LOOKUPFILTER'){
            dep.type  = 'CustomField';
        }
    })

    dependencies.push(entryPoint);

    dependencies.forEach(dep => {

        if(depsByType.has(dep.type)){
            depsByType.get(dep.type).add(dep.name);
        }
        else{
            depsByType.set(dep.type,new Set());
            depsByType.get(dep.type).add(dep.name);
        }
    });

    let xmlTop = `<?xml version="1.0" encoding="UTF-8"?>
    <Package xmlns="http://soap.sforce.com/2006/04/metadata">`;

    let typesXml = '';

    for(let [type,members] of depsByType){

        let xmlAllMembers = '';

        if(members.size > 0){

            let membersArray = Array.from(members);
            membersArray.sort();

            membersArray.forEach(m => {

                let xmlMember = `<members>${m}</members>`
                xmlAllMembers += xmlMember;
    
            });
    
            xmlAllMembers += `<name>${type}</name>`
    
            let xmlTypeMembers = `<types>${xmlAllMembers}</types>`;
            typesXml += xmlTypeMembers;
        } 
    }

    let xmlBotton = `<version>${process.env.SFDC_API_VERSION}</version>
    </Package>`

    let allXml = xmlTop+typesXml+xmlBotton;

    return allXml;
}

module.exports = createPackageXml;
