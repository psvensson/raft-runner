const raft = require('zmq-raft');

module.exports = class RunnerStateMachine extends raft.api.StateMachineBase {
  constructor(options) {
    super();
    this.initMyStateMachine().then(() => {
      this.stateHandler = options.stateHandler
      this[Symbol.for('setReady')]();
    });
  }

  async initMyStateMachine() {
    console.log('--- intializing my state machine')
    
    
  }

  

  applyEntries(logEntries, nextIndex, currentTerm, snapshot) {
    for (let [index, item] of logEntries.entries()) {
      let entry = raft.common.LogEntry.bufferToLogEntry(item, nextIndex + index);
      console.log("log entry: log-index=%s term=%s", entry.logIndex, entry.readEntryTerm());
      if (entry.isStateEntry) {
        console.log("this is state entry:");
        //  user data of the log entry
        let data = entry.readEntryData();
        this.stateHandler.handle(data)
        // ... do something with entry data
      } else if (entry.isConfigEntry) {
        console.log("this is config entry");
      } else {
        console.log("this is checkpoint entry");
      }
    }
    return super.applyEntries(logEntries, nextIndex, currentTerm, snapshot);
  }


}