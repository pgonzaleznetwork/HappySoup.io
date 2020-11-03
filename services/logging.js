

function logError(text,details){
    console.log(`HAPPY SOUP ERROR: ${text}`,JSON.stringify(details));
}

module.exports = logError;