const BaseEntry = require("./baseEntry");

module.exports = class CheckpointEntry extends BaseEntry {
    static apply(item, stateMachine) {
        console.log("this is a checkpoint entry");
    }
}