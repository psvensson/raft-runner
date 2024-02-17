const Readable = require('stream').Readable

module.exports = class SimpleStateHandler {
    constructor(opts) {
        console.log('********************** statemachine constructor **********************', opts)
        this.state = {}
    }

    handle(data) {
        return new Promise((resolve, reject) => {
            console.log('********************** statemachine handle **********************', data)
            this.setState(data.id, data.value)
            resolve()
        })
    }

    raftStateChanged(state){
        console.log('SimpleStateHandler --- raftStateChanged: ', state)
    }

    async handleSnapshot(data) {
        console.log('**********************')
        console.log('********************** statemachine handle snapshot **********************', data)
        console.log('**********************')
    }

    setState(id, value) {
        this.state[id] = value        
    }

    // createSnapshotReadStream() should return an object implementing the stream.readStream protocol that will produce the snapshot's content.
    async createSnapshotReadStream() {
        console.log('**********************')
        console.log('********************** statemachine createSnapshotReadStream **********************')
        console.log('**********************')
        const readStream = new Readable({
            read() {
                for(const prop in this.state) this.push({id: prop, value: this.state[prop]})
                this.push(null)
            }
        })
        return readStream
    }

    // serialize() should return a Buffer instance with the snapshot content.
    serialize() {
        return Buffer.from(Object.entries(this.state).map(([id, value]) => ({id, value})).toString())
    }
}