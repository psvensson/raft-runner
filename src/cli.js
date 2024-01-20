
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const RaftRunner = require('./RaftRunner');
const SimpleStateHandler = require('./SimpleStateHandler');

const argv = yargs(hideBin(process.argv)).argv

const arg_path = argv.path || ".raft/data";
const arg_id = argv.id || "id1";
const arg_port = argv.port || 8047;
const arg_peers = argv.peers ? JSON.parse(argv.peers) : undefined
const ipAddress = argv.ip ?  argv.ip : undefined

console.log('peers = ',arg_peers);
console.log('port = '+arg_port);
console.log('id = '+arg_id);

let incid = 0

const raftRunner = new RaftRunner({
    id: arg_id, 
    path: arg_path, 
    port: arg_port, 
    peers: arg_peers, 
    stateHandler: new SimpleStateHandler(), 
    ipAddress: ipAddress,
    snapshotInterval: 5}); // for testing, in reality, this would be every 1000 logs or so

// This is just a debug method to check that state is set on the leader (and then of course replicated to the replicas)
setInterval(()=> {
    console.log('--- handleInterval role is; ', raftRunner.raftState.toString())
    if (raftRunner.isLeader()) {
        raftRunner.changeStateMachine({ id: incid++, value: 'foobar' })
    }
}, 5000);
