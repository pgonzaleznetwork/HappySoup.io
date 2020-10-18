let utils = require('../services/utils');

function format(entryPoint,metadata,type){

    function xml(){

        let mtds = metadata.map(md => {
            return {...md};
        });

        let metadataByType = new Map();

        if(type === 'deps'){
            //when we look at what a metadata depends on, we don't need to include dynamic references
            //we do need them when the type is "usage"
            mtds = mtds.filter(dep => !utils.isDynamicReference(dep));
        }

        //for metadata retrieval and deployment some types need to be renamed
        mtds.forEach(dep => {
            if(dep.type.toUpperCase() == 'LOOKUPFILTER'){
                dep.type  = 'CustomField';
            }
            else if(dep.type == 'ApexClass with EmailTemplate SOQL'){
                dep.type = 'ApexClass'
            }
        })

        mtds.push(entryPoint);

        mtds.forEach(dep => {

            if(metadataByType.has(dep.type)){
                metadataByType.get(dep.type).add(dep.name);
            }
            else{
                metadataByType.set(dep.type,new Set());
                metadataByType.get(dep.type).add(dep.name);
            }
        });

        return packageXML(metadataByType);

    }

    function excel(){

        let mtds = metadata.map(md => {
            return {...md};
        });

        return sheetFormat(mtds,'excel');

    }

    function csv(){

        let mtds = metadata.map(md => {
            return {...md};
        });

        return sheetFormat(mtds,'csv');

    }

    function sheetFormat(metadata,format){

        let headers = ['Name','Metadata Type','Id','Url'];
        headers.push(type === 'deps' ? 'Used by' : 'Uses')
    
        let dataDelimiter = (format === 'excel' ? '\t' : ',');
        let EOLDelimiter = (format === 'excel' ? '' : ',');
        let newLine = '\r\n';
    
        let file = headers.join(dataDelimiter);
        file += EOLDelimiter;
    
        file += newLine;
    
        metadata.forEach(dep => {
    
            let parts = [];
      
            parts.push(`"${dep.name}"`);
            parts.push(`"${dep.type}"`);
            parts.push(`"${dep.id}"`);
            parts.push(`"${dep.url}"`);
    
            if(type === 'deps'){
                parts.push(`"${entryPoint.name} via ${dep.referencedBy.name}"`);
            }
            else if(type === 'usage'){
                parts.push(`"${entryPoint.name}"`);
            }
    
            let row = parts.join(dataDelimiter);
            row += EOLDelimiter;
    
            file += row + newLine;
        });
    
        if(format === 'csv'){
            file = file.substring(0,file.length-3);//remove the last comma
        }
    
        return file;
    
    }

    function packageXML(metadataByType){

        let xmlTop = `<?xml version="1.0" encoding="UTF-8"?>
        <Package xmlns="http://soap.sforce.com/2006/04/metadata">`;

        let typesXml = '';

        for(let [type,members] of metadataByType){

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

    return {csv,excel,xml};

}

module.exports = format;