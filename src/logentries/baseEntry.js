const raft = require('zmq-raft');
const FSM_LEADER = Symbol('Leader')

// Yes, this would have been nicer as a state-holding object of some sort, but since speed is of essence, static methods it is
module.exports = class BaseEntry {
    static getEntry(item, index) {
        return raft.common.LogEntry.bufferToLogEntry(item, index);
    }
}