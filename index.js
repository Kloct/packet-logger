const UI = require('../ui')
const bodyParser = require('../ui/node_modules/body-parser');
const fs = require('fs');
const path = require('path');
const ws = require('ws');
const defParse = require('./defParser')
const http = require('http')

module.exports = function packetLogger(mod) {
    //For standalone env install express and replace these vars
    //const UI = require('express')
    //const ui = UI()
    //ui.listen(port, () => console.log(`Express listening on port ${port}`));
    const ui = new UI(mod),
        { command } = mod.require
    let packetBatchCache = []


    /*Setup WS and api server*/
    let savedData = require('./savedData.json'),
            packetCache = [],
            filters = {
                allowlist: [],
                blocklist: []
            },
            paused = false,
            logGroup = {
                logServer: true,
                logClient: true
            }
    const server = http.createServer().listen(0)
    const wsServer = new ws.Server({ server: server })
    // Websocket keep alive
    function heartbeat(){
        this.isAlive = true;
    }
    wsServer.on('connection', socket => {
        socket.isAlive = true;
        socket.on('pong', heartbeat)
        socket.send(JSON.stringify({
            syncState: {
                packets: packetCache.map((packet)=>packet.string),
                filters,
                paused,
                logServer: logGroup.logServer,
                logClient: logGroup.logClient
            }
        }))
    })
    const wsPing = setInterval(()=>{ //keepalive ping interval
        wsServer.clients.forEach((client)=>{
            if(!client.isAlive) return client.terminate();
            client.isAlive = false;
            client.ping(()=>{})
        });
    }, 30000)
    wsServer.on('close', ()=>{
        clearInterval(wsPing)
    })
    
    ui.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    ui.use(bodyParser.json({limit: '50mb'}));
    
    let savedDataFile = path.join(__dirname, 'savedData.json')

    ui.use(UI.static(path.join(__dirname, 'build')))
    



    const batchPacketUpdates = setInterval(()=>{ //sending packets in batches as to not flood the UI's listener
        if(packetBatchCache.length>0){
            if(packetCache.length+packetBatchCache.length>200) packetCache.splice(0, packetCache.length+packetBatchCache.length-200) // max size 200
            wsServer.clients.forEach((client)=>{
                client.send(JSON.stringify({packets: packetBatchCache.map((packet)=>packet.string)}))
            })
            packetCache.push(...packetBatchCache)
            packetBatchCache = []
        }
        
    }, 100)
    function syncState(){ //Probably a better way of handleing UI desyncronization
        wsServer.clients.forEach((client)=>{
            client.send(JSON.stringify({
                syncState: {
                    packets: packetCache.map((packet)=>packet.string),
                    filters,
                    paused,
                    logServer: logGroup.logServer,
                    logClient: logGroup.logClient
                }
            }))
        })
    }
    ui.post('/changeFilters', (req, res) => { //post add/remove filter | TODO: hook up to filter packets
        if (req.body.entry){ //add filter
            filters[req.body.type].push(req.body.entry)
        } else { //remove filter
            filters[req.body.type].splice(req.body.index, 1)
        }
        res.json({})
        syncState();
    })
    ui.post('/clearFilters', (req, res)=>{
        filters[req.body.type]=[]
        res.json({})
        syncState();
    })
    ui.get('/pause', (req, res) => { //pause packet cap
        paused = !paused
        res.json({})
        syncState();
    })
    ui.post('/saveFilters', (req, res)=>{ //post save filters
        Object.assign(savedData.savedFilters, {
            [req.body.name]:{
                allowlist: [...filters.allowlist],
                blocklist: [...filters.blocklist]
            }
        })
        fs.writeFileSync(savedDataFile, JSON.stringify(savedData, null, '\t'))
        res.json({})
    })
    ui.get('/savedFilters', (req, res)=>{ //get saved filters list
        res.json(Object.keys(savedData.savedFilters))
    })
    ui.post('/loadFilters', (req, res)=>{ //get load filter
        console.log(savedData.savedFilters)
        filters = { //what a mutable nightmare
            allowlist: [...savedData.savedFilters[req.body.selectedTemplate].allowlist],
            blocklist: [...savedData.savedFilters[req.body.selectedTemplate].blocklist]
        }
        res.json({});
        syncState();
    })
    ui.post('/saveLogs', (req, res)=>{ //post save logs
        Object.assign(savedData.savedLogs, {[req.body.name]: packetCache})
        fs.writeFileSync(savedDataFile, JSON.stringify(savedData, (key, value) => typeof value === 'bigint' ? value.toString() + 'n' : value, '\t'))
        res.json({});
    })
    ui.get('/savedLogs', (req, res)=>{ //get saved logs list
        res.json(Object.keys(savedData.savedLogs))
    })
    ui.post('/loadLogs', (req, res)=>{ //get load log
        packetCache = [...savedData.savedLogs[req.body.logname]]
        res.json({});
        syncState();
    })
    ui.post('/deleteFromSaved', (req, res)=>{ //post delete from saved data
        delete savedData[req.body.type][req.body.name]
        fs.writeFileSync(savedDataFile, JSON.stringify(savedData, (key, value) => typeof value === 'bigint' ? value.toString() + 'n' : value, '\t'))
        res.json(Object.keys(savedData[req.body.type]))
    })
    ui.post('/getHex', (req, res)=>{ //Hex Tool Call
        res.json(readHex(req.body.hexx.split(/\s|\n/g).join("")))
    })
    ui.post('/filterGroup', (req, res)=>{
        logGroup = Object.assign(logGroup, req.body)
        res.json({})
        syncState();
    })
    ui.post('/getDef', (req, res)=>{
        const name = req.body.name,
            defs = name && mod.dispatch.protocol.constructor.defs.get(name),
            defVersion = defs && Math.max(...defs.keys()),
            protocolPath = path.join(__dirname, '..', '..', 'node_modules', 'tera-data', 'protocol'),
            defPath = path.join(protocolPath, `${name}.${defVersion}.def`)
        try{
            res.json({def: defParse(fs.readFileSync(defPath, 'utf-8'), protocolPath).join('\n')})
        } catch(e){
            res.json({def: `No defintion found for packet: ${name}`})
        }
        
    })
    ui.post('/getPacketData', (req, res)=>{
        let packetData = JSON.stringify(packetCache[req.body.index], (key, value) =>
            typeof value === 'bigint' ? value.toString() + 'n' : value // serialize bigint as string
        )
        res.json(packetData)
    })
    ui.get('/clearLog', (req, res)=>{
        packetCache = []
        syncState();
    })
    ui.get('/wsPort', (req, res)=>{
        res.json({port: server.address().port})
    })
    //https://github.com/tera-mods/debug credit to Pinkie for original hook implementation
    const cache = []
    //hook original packets
    mod.hook('*', 'raw', { order: -Infinity }, (code, data) => {
        cache.push({ code, data: Buffer.from(data) })
    })
    //hook all packets after mods
    mod.hook('*', 'raw', { order: Infinity, filter: {
        // These need to go through so we can clean up from our previous hook, even if we're not logging them
        fake: null,
        modified: null,
        silenced: null
    } }, (code, data) => {
        if (data.$fake) {
            if (!data.$silenced) //don't need to log silenced packets
                writePacket({ code, data }, {
                    incoming: data.$incoming,
                    fake: true,
                    silenced: false
                })
            return
        }
        const origPacket = cache.pop()
        if (origPacket)
            writePacket(origPacket, {
                incoming: data.$incoming,
                fake: false,
                silenced: data.$modified
            })
        if (data.$modified && !data.$silenced) //don't need to log silenced packets
            writePacket({ code, data }, {
                incoming: data.$incoming,
                fake: true,
                silenced: false
            })
    })
    //apply filters write packet
    function writePacket(pkt, flags) {
        //get pkt name
        const name = mod.dispatch.protocol.packetEnum.code.get(pkt.code),
            defs = name && mod.dispatch.protocol.constructor.defs.get(name),
            defVersion = defs && Math.max(...defs.keys())
        //uily filters
        if(filters.allowlist.length>0&&!filters.allowlist.includes(name)) return;
        if(filters.blocklist.includes(name)) return;
        if(!logGroup.logServer&&flags.incoming) return;
        if(!logGroup.logClient&&!flags.incoming) return;
        let parsed = null,
            badDef = false
        if (defs)
            try {
                parsed = mod.parse(pkt.code, defVersion, pkt.data)
                badDef = mod.packetLength(pkt.code, defVersion, parsed) !== pkt.data.length
            } catch (e) { badDef = true }
        let packet = {
            string: name,
            version: defVersion?defVersion:"",
            badDef: badDef,
            data: parsed?parsed:{Error:`Could not parse ${name}: No definition found.`},
            hex: pkt.data.toString('hex')
        }
        if (!paused){
            packetBatchCache.push(packet)
        }
            
    }

    function readHex(hexx) {
        let hex = hexx.length%2>0?"0"+hexx:hexx //byte pad
        let len = hex.length/2 //len = byte length
        let buf = Buffer.alloc(0xFF) //initialize buffer
        try{
            buf.write(hex, 0, len, 'hex') //write hex
            if (len>0xFF) throw "hex too large"
            if(hex.match(/[0-9a-f]+/i)[0]!==hex) throw "invalid hex"
        }
        catch(e){
            if (e==="too long") return e
            return "invalid hex"
        }
        return {
            int16: len>2?"overflow":buf.readInt16LE().toString(),
            int32: len>4?"overflow":buf.readInt32LE().toString(),
            int64: len>8?"overflow":buf.readBigInt64LE().toString(),
            float: len>4?"overflow":buf.readFloatLE().toString(),
            double: len>8?"overflow":buf.readDoubleLE().toString(),
            string: buf.toString('ucs2', 0, len)
        }
    }
    command.add('logger', ()=>{
        ui.open()
    })
}