const BaseEntry = require("./baseEntry");

module.exports = class StateEntry extends BaseEntry{
    static apply(entry, stateMachine) {
        console.log("this is a state entry. ");
        //  user data of the log entry
        let data = entry.readEntryData();
        stateMachine.stateHandler.handle(JSON.parse(data)).then((result) => {
            console.log('--- state entry applied, result is: ', result)
        })
    }   
}