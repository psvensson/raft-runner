const raft = require('zmq-raft');
const FSM_LEADER = Symbol('Leader')

module.exports = class BaseEntry {
    static isLeader(stateMachine) {
        return stateMachine.runner.zmqRaft.state.toString() === FSM_LEADER.toString()
    }

    static getEntry(item, index) {
        return raft.common.LogEntry.bufferToLogEntry(item, index);
    }
}