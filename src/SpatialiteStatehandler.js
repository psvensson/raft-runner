/**
 * This is a class that wraps the Spatialite persistence layer.
 * It stores volumes and their associated data in a spatialite database.
 */

const SPL = require('spl');

async function getSplDB() {
    const spl = await SPL();
    const db = await spl.db();
    return db;
}

module.exports = class SpatialiteStateHandler {
    constructor() {
    }

    handle(data) {
        console.log("SpatialiteStateHandler: " + data);
    }
}



