const raft = require('zmq-raft');
const stateMachine = require('./RunnerStateMachine');
const { listeners } = require('process');

module.exports = class RaftRunner {
    constructor(args) {
        const { id, path, port, peers, stateHandler, ipAddress, snapshotInterval } = args;
        this.stateHandler = stateHandler
        this.leaderId = undefined
        this.setUpProcessHandlers()
        const options = this.getOptions(id, path, port, peers, stateHandler, ipAddress, snapshotInterval);
        this.buildZmqRaft(options, id, peers, port);
        this.createZmqRaftClient(peers);
    }

    buildZmqRaft(options, id, peers, port) {
        console.log('buildZmqRaft, options = ', options)
        const runner = this;
        raft.server.builder.build(options).then(zmqRaft => {
            runner.zmqRaft = zmqRaft;
            const raftPeers = this.zmqRaft.cluster.ocluster;
            // If we are joining an existing cluster, we need to add our address to the peers list
            if (!raftPeers.has(id)) {
                const newPeers = [...peers, this.getPeerObjectFor(id, this.getExternalIp(), port)]
                console.dir(newPeers)
                const requestId = raft.utils.id.genIdent();
                this.client.configUpdate(requestId, newPeers, 5000);
            }
        });
    }

    createZmqRaftClient(peers) {
        const clientSeedPeers = peers.map(peer => peer.url);
        this.client = new raft.client.ZmqRaftClient(clientSeedPeers, {
            secret: '', lazy: true, heartbeat: 5000
        });
    }

    isLeader() {
        return this.raftState.toString() === 'Symbol(Leader)'
    }

    // This is the way to send something to the state machine that means something to it
    changeStateMachine(data) {
        this.clientSend(data)
    }

    handleRaftState(state, term) {
        console.log('--- handleRaftState: ', state, term)
        this.raftState = state
        this.client.requestConfig(5000).then(peers => {
            console.log('--- handleRaftState: peers = ', peers)
            this.leaderId = peers.leaderId
        })
        this.stateMachine.stateHandler.raftStateChanged(state)
    }

    leaderId() {
        return this.leaderId
    }   

    async clientSend(text) {
        const serializedTxData = Buffer.from(JSON.stringify(text));
        const requestId = raft.utils.id.genIdent();
        const logIndex = await this.client.requestUpdate(requestId, serializedTxData);

    }

    getPeerObjectFor(id, ipAddr, port) {
        const myAddr = this.getUrlFor(ipAddr, port)
        const myWWW = this.getUrlFor(ipAddr, parseInt(port) + 1)
        const myPub = this.getUrlFor(ipAddr, parseInt(port) + 2)
        return { id: id, url: myAddr, www: myWWW, pub: myPub }
    }

    getOptions(id, path, port, peers, stateHandler, ipAddress, snapshotInterval) {
        //console.log('getOptions, peers = ', peers)
        const runner = this;
        const ipAddr = ipAddress || this.getExternalIp()
        const myAddr = this.getUrlFor(ipAddr, port)
        const myWWW = this.getUrlFor(ipAddr, parseInt(port) + 1)
        const myPub = this.getUrlFor(ipAddr, parseInt(port) + 2)
        const defaultPeers = [this.getPeerObjectFor(id, ipAddr, port)]
        const options = {
            id: id,
            secret: "",
            peers: peers || defaultPeers,
            data: {
                path: path,
                appendIdToPath: true
            },
            router: {
                //bind: 'tcp://*:' + port,
                bind: myAddr,
            },
            broadcast: {
                /* required for broadcast state */
                url: myPub,
            },
            factory: {
                state: (options) => {
                    options.stateHandler = stateHandler;
                    options.runner = runner;
                    options.snapshotInterval = snapshotInterval;
                    this.stateMachine = new stateMachine(options);
                    return this.stateMachine
                }
            },
            listeners: {
                state: this.handleRaftState.bind(this)
            }
        }
        if (options.peers[0] && options.peers[0].www) {
            options.webmonitor = { enable: true, host: ipAddr, port: parseInt(port) + 1 }
        }
        return options
    }

    getUrlFor(address, port) {
        return `tcp://${address}:${port}`;
        //return `tcp://127.0.0.1:${port}`;
    }

    // Get first external IP address of this machine as a string
    getExternalIp() {
        const os = require('os');
        const ifaces = os.networkInterfaces();
        let ip = undefined;
        Object.keys(ifaces).forEach(function (ifname) {
            ifaces[ifname].forEach(function (iface) {
                if ('IPv4' !== iface.family || iface.internal !== false) {
                    return;
                }
                ip = iface.address;
            });
        });
        return ip;
        //return '127.0.0.1'
    }

    setUpProcessHandlers() {
        process
            .on('SIGUSR2', () => {
                console.debug('terminating * SIGUSR2 *');
                this.shutdown();
            })
            .on('SIGTERM', () => {
                console.debug('terminating * SIGINT *');
                this.shutdown();
            })
            .on('SIGINT', () => {
                console.debug('terminating * SIGINT *');
                this.shutdown();
            })
            .on('SIGHUP', () => {
                console.debug('terminating * SIGHUP *');
                this.shutdown();
            })
            .on('uncaughtException', (err) => {
                console.debug('Caught unhandled exception: %s', err);
                if (err.stack) console.error(err.stack);
                this.shutdown();
            })
            .on('exit', () => {
                console.log('bye bye');
            });
    }

    shutdown() {
        if (!this.zmqRaft) process.exit();
        this.zmqRaft.close().then(() => process.exit(), () => process.exit());
        this.zmqRaft = undefined;
    }
}