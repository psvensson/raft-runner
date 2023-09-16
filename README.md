# raft-runner

## Description
An encapsulation of zmq-raft which let you add in your own state machine and data persistence layer.
Zmq-raft is a very nice node.js raft implementation which (unless a number of others) is not an academic excerise or hobby project.
It tajes care of edge-cases and have both good logging and documentation; https://github.com/royaltm/node-zmq-raft/tree/master

However, you need to udnerstand the Raft protocol fairly well to be able to make us of it, so this project is a conveinece wrapper
around it, to hide as much of the complex stuff as it can.

The base class to use is RaftRunner, which assume you already have an existing or soon-to-come running Raft cluster that the process is to become part of. You need to pass in the ip addrress and port of the current peer (the process) as well as all other known peers. You also need to provide your own state machine.

The state machine can be anything at all which you want to replicate using Raft. But an example could be this;

You want to create a Raft cluster of a small service which reads and persists data using a local databse (like Sqlite).
Raft uses something called Log entries, which are essentialy commands which has meaning for your state machine, and could be any data.

Let's say that you have already done all the work described here and have a Raft group consisting of three Peers (which is the minimum for things to work) and your own state machine implementation.

Then one of the peers gets a request from a client (it might also have a web service interface), which results in some data being written to the database. Instead of writing directly to the database, peer instance (where you have instantiated the RaftRunner object) uses changeStateMachine to create a new log entry (which we assume will tell your state machine to write data to the databse).

The underlying logic will then call the handle() method on all three peers (including the instanjce we are talking about now) which will handle the log entry. It could be something simple like this: {command: 'write', data: [...]}. See the SimpleStateMachine class for an example.

The state machine also need implement the methods createSnapshotReadStream() and serialize() so that snapshots of the data can be created at regular intervals (otherwise the log files would grow and grow and grow and..). It also needs to implement a receiving handleSnapshot() method which is called when a peer receive a snapshot.

You think this is complicated? Not in comparison :D 

## Features
- Implement dynamkic joining of peers, so you don't need either to hard-code or start from a CLI (unless you want to)
- Hiding most of the gnarly stuff so you don't need to understand Raft (so much) to be able to use it

## API
Create a new RaftRunner instance (a Peer in the Raft cluster)
```new RaftRunner(our_id, local_dir_path, our_port, raft_peers, stateHandler);```
If our port and addrss does not exist in the provided lsit of existing peers, this is taken as an instruction for us to join an existing raft cluster as a new member.

## Installation


## Testing
Four test scripts has been provided, which assumes that they are run from the root-directory, like './src/start1.sh' et.c.
The first three scriupts create three raft peers that form a cluster on the local machine, and the third demonstrates how to join the existing cluster (to be run after the first three scrpts has run) with a new, fourth peer.

You can see the current state of the cluster by goin to the web interface provided by the underlying zmq-raft project at localhost:8042

