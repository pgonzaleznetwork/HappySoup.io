let utils = require('../services/utils');

/**
 * Creates a stats object which contains counts how many dependencies exist
 * of a particular metadata type. 
 */
function stats(dependencies){

    let depsByType = new Map();

    dependencies = dependencies.filter(dep => !utils.isDynamicReference(dep));

    /**
     * The dependencies passed to this method can be repeated (i.e a custom field is referenced 3 times)
     * so we need to create a map to uniquely identify them
     */
    dependencies.forEach(dep => {

        if(depsByType.has(dep.type)){
            depsByType.get(dep.type).add(dep.name);
        }
        else{
            depsByType.set(dep.type,new Set());
            depsByType.get(dep.type).add(dep.name);
        }
    });
    
    stats = {};

    for(let [type,members] of depsByType){
        stats[type] = members.size;
    }

    return stats;
}

module.exports = stats;