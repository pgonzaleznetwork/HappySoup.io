

function logError(text,details){
    console.log(`HAPPY SOUP ERROR: ${text}`,JSON.stringify(details,null,2));
}

module.exports = logError;