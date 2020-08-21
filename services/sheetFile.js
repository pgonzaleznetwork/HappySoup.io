function sheetFile(entryPoint,dependencies,type,format){

    let headers = ['Name','Metadata Type','Id','Url'];
    headers.push(type === 'deps' ? 'Used by' : 'Uses')

    let dataDelimiter = (format === 'excel' ? '\t' : ',');
    let EOLDelimiter = (format === 'excel' ? '' : ',');
    let newLine = '\r\n';

    let file = headers.join(dataDelimiter);
    file += EOLDelimiter;

    file += newLine;

    dependencies.forEach(dep => {

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
        file = file.substring(0,file.length-1);//remove the last comma
    }

    return file;

}

module.exports = sheetFile;