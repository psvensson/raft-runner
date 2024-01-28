const BaseEntry = require("./baseEntry");

module.exports = class CheckpointEntry extends BaseEntry {
    static async apply(item, stateMachine) {
        console.log("this is a checkpoint entry");
    }
}