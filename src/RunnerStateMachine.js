const raft = require('zmq-raft');
const path = require('path')
const FileLog = raft.server.FileLog
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
      this.snapshotInterval = options.snapshotInterval || 1000;
      this.entriesSinceLastSnapshot = 0
      //console.log('///////////////////////// constructor options are ', options)
      this.raft = options.runner.zmqRaft;
      this[Symbol.for('setReady')]();
    });
  }

  async initStateMachine() {
    console.log('--- intializing runner state machine')
  }


  checkForNextEntry(entries) {
    if (entries.length > 0) {
      const entry = entries.shift()
      console.log('===== applyEntries, entryType is: ', entry.entryType)
      // Some nice polymorphic OO going on here, avert your eyes, kids
      entryTypes[entry.entryType].apply(entry, this).then(() => {
        this.checkForNextEntry(entries)
      })
    }
  }

  applyEntries(logEntries, nextIndex, currentTerm, snapshot) {
    console.log('===== applyEntries, we got ' + logEntries.length + ' log entries, snapshot is: ', snapshot)
    if (snapshot) {
      //console.log('===== applyEntries, snapshot is: ', snapshot)
      this.stateHandler.handleSnapshot(snapshot);
    }
    
    const logEntriesArray = [];
    for (let [index, item] of logEntries.entries()) {
      logEntriesArray.push(item)
    }
    const entries = logEntriesArray.map((item, index) => BaseEntry.getEntry(item, nextIndex + index))
    this.checkForNextEntry(entries)
    this.checkForSnapshot(logEntries[logEntries.length - 1]);

    return super.applyEntries(logEntries, nextIndex, currentTerm, snapshot);
  }


  checkForSnapshot(entry) {
    //console.log('------------------------------------------- checking for snapshot. Entry; ', entry)
    if (entry) {
      this.entriesSinceLastSnapshot++
      console.log('------------------------------------------- checking for snapshot. logIndex is: ' + entry.logIndex + ' entriesSinceLastSnapshot is: ' + this.entriesSinceLastSnapshot + ' and snapshotInterval is: ' + this.snapshotInterval + ' and isLeader is: ' + this.runner.isLeader() )
      if (this.entriesSinceLastSnapshot > this.snapshotInterval && this.runner.isLeader()) {
        console.log('--- creating snapshot')
        this.createSnapshot(entry.logIndex).then(() => {
          this.entriesSinceLastSnapshot = 0
          console.log('--- snapshot created')
        })
      }
    }
  }


  async createSnapshot(logIndex) {
    const raft = this.runner.zmqRaft
    const compactionIndex = Math.min(raft.commitIndex, raft.pruneIndex);
    //console.log('+++ createSnapshot compactionIndex: ', compactionIndex)
    //console.log('+++ createSnapshot commitIndex: ', raft.commitIndex)
    //console.log('+++ createSnapshot pruneIndex: ', raft.pruneIndex)
    const compactionTerm = await raft._log.termAt(compactionIndex);
    const readStream = await this.stateHandler.createSnapshotReadStream();
    const snapshot = raft._log.createTmpSnapshot(compactionIndex, compactionTerm, readStream);
    const filename = await raft._log.installSnapshot(snapshot, true);
    console.log('-------------------------------- old snapshot file names: ')
    const filesToDelete = await this.listPruneFiles(raft._log, logIndex);
    console.log('-------------------------------- deleting snapshot files: ', filesToDelete)
    if (filesToDelete) {
      for (let filePath of filesToDelete) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('Error deleting file:', err);
          } else {
            console.log('File deleted successfully');
          }
        })
      }
    }
  }

  listPruneFiles(fileLog, lastIndex) {
    console.log('====///==== list prune file at directory; ', fileLog.logdir, ' and lastIndex is: ', lastIndex)
    return fileLog.findIndexFilePathOf(lastIndex)
      .then(lastPath => {
        console.log('=== lastPath is: ', lastPath)
        if (!lastPath) return;
        var lastName = path.basename(lastPath);
        return FileLog.readIndexFileNames(fileLog.logdir, (filePath) => {
          console.log('++++++ checking filename ' + filePath)
          if (path.basename(filePath) < lastName) {
            process.stdout.write('******* can delete: ' + filePath + "\n");
            return true;
          }
        });
      });
  }
}