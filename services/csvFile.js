function csvFile(entryPoint,dependencies,type,format){


    let csvContent = `"Name","Metadata Type","Id","Url",`;

    if(type === 'deps'){
        csvContent += `"Used by",`;
    }
    else if(type === 'usage'){
        csvContent += `"Uses",`;
    }

    csvContent += '\r\n';

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

        let row = parts.join(",");
        row += ',';

        csvContent += row + "\r\n";
    });

    csvContent = csvContent.substring(0,csvContent.length-1);//remove the last comma

    return csvContent;

}

module.exports = csvFile;