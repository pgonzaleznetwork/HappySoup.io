/**
 * The metadata component dependency API also returns references to objects that are only known at run time, for example
 * a test class that queries the Profile object to create a test user. The profile object is returned as a dependency
 * but we don't know what profile is actually being used, again, this is onl known at run time.
 */
function isDynamicReference(dep){

    let types = ['Queue','Profile','User','EmailTemplate','RecordType','Report'];
    return types.indexOf(dep.type) != -1;
}

module.exports = {isDynamicReference}