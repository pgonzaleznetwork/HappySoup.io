function excelFile(entryPoint,dependencies,type){

    let excelContent = `"Name"\t"Metadata Type"\t"Id"\t"Url"`;

    if(type === 'deps'){
        excelContent += `\t"Used by"`;
    }
    else if(type === 'usage'){
        excelContent += `\t"Uses"`;
    }

    excelContent += '\r\n';

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

        let row = parts.join("\t");
        console.log(row);
  
        excelContent += row + "\r\n";
    });

    //excelContent = excelContent.substring(0,excelContent.length-1);//remove the last comma

    console.log('FULL CONTENT');
    console.log(excelContent);

    return excelContent;

}

module.exports = excelFile;