const raft = require('zmq-raft');
const RunnerStateMachine = require('./RunnerStatemachine');

module.exports = class RaftRunner {
    constructor(id, path, port, peers, stateHandler) {
        this.setUpProcessHandlers()
        const options = this.getOptions(id, path, port, peers,stateHandler)
        console.log('-------------------- builder options: ', options)
        raft.server.builder.build(options).then(zmqRaft => {
            this.zmqRaft = zmqRaft;
            const peers = this.zmqRaft.peers;
            console.log('raft peers: ', peers)
        });
    }

    getOptions(id, path, port, peers, stateHandler) {
        const ipAddr = this.getExternalIp()
        const myAddr = this.getUrlFor(ipAddr, port)
        const myWWW = this.getWwwFor(ipAddr, parseInt(port)+1)
        const defaultPeers = [{ id: "id1", url: myAddr, www: myWWW }]
        const options = {
            id: id,
            secret: "",
            peers: peers || defaultPeers,
            data: {
                path: path
            },
            router: {
                bind: 'tcp://*:' + port,
            },
            factory: {
                state: (options) => {
                    options.stateHandler = stateHandler;
                    return new RunnerStateMachine(options)
                }
            }
        }
        if(options.peers[0].www) {
            options.webmonitor = {enable: true, host: ipAddr, port: parseInt(port)+1}
        }
        return options
    }

    getUrlFor(address, port) {
        return `tcp://${address}:${port}`;
        //return `tcp://127.0.0.1:${port}`;
    }

    getWwwFor(address, port) {
        return `http://${address}:${port}`;
        //return `http://127.0.0.1:${port}`;
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
                shutdown();
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