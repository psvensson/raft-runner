const BaseEntry = require("./baseEntry");

module.exports =  class ConfigEntry extends BaseEntry {
    static apply(entry, stateMachine) {
        console.log("this is a config entry");
        
    }
}