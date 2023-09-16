const Readable = require('stream').Readable

module.exports = class SimpleStateHandler {
    constructor() {
        this.state = {}
    }

    handle(data) {
        console.log("SimpleStateHandler handle: " + data);
        this.setState(data.id, data.value)
    }

    handleSnapshot(data) {
        console.log("SimpleStateHandler handleSnapshot: " + data);
    }

    setState(id, value) {
        this.state[id] = value        
    }

    // createSnapshotReadStream() should return an object implementing the stream.readStream protocol that will produce the snapshot's content.
    createSnapshotReadStream() {
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