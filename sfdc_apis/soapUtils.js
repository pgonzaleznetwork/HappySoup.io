
function isSoapFailure(json){
    if(json['soapenv:Envelope']['soapenv:Body']['soapenv:Fault']){
        return true; 
    }
    return false;
}

function getFetchOptions(soapBody){
    return {
        method:'POST',
        headers:{
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction':'c',
            'Accept-Encoding': 'gzip,deflate'
            
        },
        body:soapBody
    }
}

module.exports = {
    isSoapFailure,getFetchOptions
}