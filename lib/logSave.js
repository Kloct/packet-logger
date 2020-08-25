var flatbuffers = require('flatbuffers').flatbuffers;
var Logger = require('./packetLog_generated').Logger;

var LogSave = LogSave || {};

LogSave.serialize = (packetsArr)=>{ //serialize packet log
    var builder = new flatbuffers.Builder(1024)
    var packets = []
    for (var { code, name, version, fake, data, timestamp } of packetsArr){ //serialize packets
        //setup types
        var dataBuf = Uint8Array.from(data)
        var dataS = Logger.Packet.createDataVector(builder, dataBuf)
        var nameS = builder.createString(name)
        var date = flatBufferTimeStamp(timestamp)
        var timestampS = builder.createLong(date.low, date.high)

        Logger.Packet.startPacket(builder)
        Logger.Packet.addCode(builder, code)
        Logger.Packet.addName(builder, nameS)
        Logger.Packet.addVersion(builder, version)
        Logger.Packet.addFake(builder, fake)
        Logger.Packet.addData(builder, dataS)
        Logger.Packet.addTimestamp(builder, timestampS)
        packets.push(Logger.Packet.endPacket(builder))
    }
    //add packets to buffer vector
    var buffer = Logger.PacketLog.createBufferVector(builder, packets)
    //create packet log
    Logger.PacketLog.startPacketLog(builder)
    Logger.PacketLog.addBuffer(builder, buffer)
    var savedlog = Logger.PacketLog.endPacketLog(builder)

    builder.finish(savedlog)
    return builder.asUint8Array() //can write file in calling function
}
LogSave.parse = (bytes)=>{ //parse saved log as packet log
    var buf = new flatbuffers.ByteBuffer(bytes)
    var savedLogBuf = Logger.PacketLog.getRootAsPacketLog(buf)
    var savedLog = []
    for (var i=0; i<savedLogBuf.bufferLength(); i++){
        var packet = savedLogBuf.buffer(i)
        savedLog.push ({
            code: packet.code(),
            name: packet.name(),
            version: packet.version(),
            fake: packet.fake(),
            data: parseDataBuffer(packet),
            timestamp: dateNumber(packet.timestamp())
        })
    }
    return savedLog
}

//breakfest cereal, part of your every day balanced diet
this.LogSave = LogSave

//probably bad helper functions
function flatBufferTimeStamp(value) {
    var bin = (value).toString(2); 
    var pad = new Array(64 - bin.length + 1 ).join('0'); 
    bin = pad + bin;  
    return {
        low: parseInt(bin.substring(32), 2), 
        high: parseInt(bin.substring(0, 32), 2)
    };
}
function dateNumber(obj){
    return parseInt(obj.high.toString(16).concat(obj.low.toString(16)), 16)
}
function parseDataBuffer(packet){
    var bytes = []
    for (var i=0;i<packet.dataLength();i++){
        bytes.push(packet.data(i))
    }
    return new Buffer.from(bytes)
}
