
let jsforce = require('jsforce');

function metadataApi(instanceURL,accessToken){
    
    let conn = new jsforce.Connection({
        instanceUrl : instanceURL,
        accessToken : accessToken
    });

    //let conn = new jsforce.Connection({ accessToken: accessToken });
    let types = [{type: 'ApexClass', folder: null}];
    conn.metadata.list(types, '47.0', function(err, metadata) {
    if (err) { return console.error('err', err); }
        let meta = metadata[0];
        console.log('metadata count: ' + metadata.length);
        console.log('createdById: ' + meta.createdById);
        console.log('createdByName: ' + meta.createdByName);
        console.log('createdDate: ' + meta.createdDate);
        console.log('fileName: ' + meta.fileName);
        console.log('fullName: ' + meta.fullName);
        console.log('id: ' + meta.id);
        console.log('lastModifiedById: ' + meta.lastModifiedById);
        console.log('lastModifiedByName: ' + meta.lastModifiedByName);
        console.log('lastModifiedDate: ' + meta.lastModifiedDate);
        console.log('manageableState: ' + meta.manageableState);
        console.log('namespacePrefix: ' + meta.namespacePrefix);
        console.log('type: ' + meta.type);
    });

}

metadataApi('https://websummit.my.salesforce.com','00D20000000CW8r!AR8AQA.GebxD4IjqU3nXWm6q1f5PjgYLSw28TcLD3sPA0NaWyzzaMCS3a43Gp.Th.JeaNPWGmaMzGVW38UhgE3dOasQ_kBuH');