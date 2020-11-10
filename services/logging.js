

function logError(text,details){

    let {error} = details;

    //Error objects cannot be JSON.stringified so here we extract the
    //properties we care about and reassign them as new properties
    //these allows these properties to be displayed in the JSON output
    if(error){
        let {message,stack} = error;
        error = {message,stack};
        details.error = error;
    }

    console.log(`HAPPY SOUP ERROR: ${text}`,JSON.stringify(details));
}

module.exports = logError;