const BaseEntry = require("./baseEntry");

module.exports = class StateEntry extends BaseEntry{
    static async apply(entry, stateMachine) {
        console.log("this is a state entry. ");
        //  user data of the log entry
        let data = entry.readEntryData();
        // Block until each handle operation is finished, otherwise we might execute state out of order   
        const result = await stateMachine.stateHandler.handle(JSON.parse(data))
        console.log('--- state entry applied, result is: ', result)
        
    }   
}