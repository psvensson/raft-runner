const raft = require('zmq-raft');

const BaseEntry = require('./logentries/baseEntry')
/*
** Implicity entry types used as order in the array below for object lookup later, but not really used here.
const LOG_ENTRY_TYPE_STATE = 0
    , LOG_ENTRY_TYPE_CONFIG = 1
    , LOG_ENTRY_TYPE_CHECKPOINT = 2;
*/
const entryTypes = [
  require('./logentries/stateEntry'),
  require('./logentries/configEntry'),
  require('./logentries/checkpointEntry')
]


module.exports = class RunnerStateMachine extends raft.api.StateMachineBase {
  constructor(options) {
    super();
    this.initStateMachine().then(() => {
      this.stateHandler = options.stateHandler
      this.runner = options.runner;
      console.log('///////////////////////// constructor options are ', options)
      this.raft = options.runner.zmqRaft;
      this[Symbol.for('setReady')]();
    });
  }

  async initStateMachine() {
    console.log('--- intializing runner state machine')
  }
  
  applyEntries(logEntries, nextIndex, currentTerm, snapshot) {
    console.log('===== applyEntries, we got '+logEntries.length+' log entries, snapshot is: ', snapshot)
    if(snapshot) {
      console.log('===== applyEntries, snapshot is: ', snapshot)
      this.stateHandler.handleSnapshot(snapshot);
    }
    for (let [index, item] of logEntries.entries()) {
      const entry = BaseEntry.getEntry(item, nextIndex + index);
      console.log('===== applyEntries, entryType is: ', entry.entryType)
      entryTypes[entry.entryType].apply(item, this);
    }
    return super.applyEntries(logEntries, nextIndex, currentTerm, snapshot);
  }

  async createSnapshot() {
    const raft = this.runner.zmqRaft
    const compactionIndex = Math.min(raft.commitIndex, raft.pruneIndex);
    console.log('+++ createSnapshot compactionIndex: ', compactionIndex)
    console.log('+++ createSnapshot commitIndex: ', raft.commitIndex)
    console.log('+++ createSnapshot pruneIndex: ', raft.pruneIndex)
    const compactionTerm = await raft._log.termAt(compactionIndex);
    const readStream = this.stateHandler.createSnapshotReadStream();
    const snapshot = raft._log.createTmpSnapshot(compactionIndex, compactionTerm, readStream);
    const filename = await raft._log.installSnapshot(snapshot, true);
  }

}