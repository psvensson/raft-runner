const raft = require('zmq-raft');
const RunnerStateMachine = require('./RunnerStatemachine');
const { listeners } = require('process');

module.exports = class RaftRunner {
    constructor(id, path, port, peers, stateHandler) {
        this.setUpProcessHandlers()
        const options = this.getOptions(id, path, port, peers, stateHandler)
        console.log('-------------------- builder options: ', options)
        raft.server.builder.build(options).then(zmqRaft => {
            this.zmqRaft = zmqRaft;
            const peers = this.zmqRaft.peers;
            console.log('raft peers: ', peers)            
        });
        // DEBUG
        setInterval(this.handleInterval.bind(this), 15000)
        // ------------------------
        const clientSeedPeers = peers.map(peer=>peer.url)
        this.client = new raft.client.ZmqRaftClient(clientSeedPeers, {
            secret: '', lazy: true, heartbeat: 5000
        });
        
    }

    handleInterval() {
        console.log('--- handleInterval role is; ',this.raftState.toString())
        if (this.raftState.toString() === 'Symbol(Leader)') {
            // Send sample message throught the client
            console.log('--- sending message to all peers')
            this.clientSend('hello world')
        }
    }

    handleRaftState(state, term) {
        console.log('--- handleRaftState: ', state, term)
        this.raftState = state
    }

    async clientSend(text) {
        const serializedTxData = Buffer.from(JSON.stringify(text));
        const requestId = raft.utils.id.genIdent();
        const logIndex = await this.client.requestUpdate(requestId, serializedTxData);
    }

    getOptions(id, path, port, peers, stateHandler) {
        const ipAddr = this.getExternalIp()
        const myAddr = this.getUrlFor(ipAddr, port)
        const myWWW = this.getUrlFor(ipAddr, parseInt(port) + 1)
        const myPub = this.getUrlFor(ipAddr, parseInt(port) + 2)
        const defaultPeers = [{ id: "id1", url: myAddr, www: myWWW, pub: myPub }]
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
                    return new RunnerStateMachine(options)
                }
            },
            listeners:{
                state: this.handleRaftState.bind(this)
            }
        }
        if (options.peers[0].www) {
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