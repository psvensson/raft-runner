# raft-runner

## Description
An encapsulation of zmq-raft which let you add in command handling, timers and data persistence layer
## Features
- web request handlers which get readers and writers for pesistence layer
- caching of wwrites distributed by raft logs, used by reader instances
- plugable persistence layer, enforced to implement zmq-raft log compaction and snapshots
- persisted timed function which gets executed by raft leader 
## Installation

## Usage

