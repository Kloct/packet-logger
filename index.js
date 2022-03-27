const UI = require('../ui'),
    fs = require('fs'),
    path = require('path'),
    ws = require('ws'),
    http = require('http'),
    bodyParser = require('../ui/node_modules/body-parser'),
    defParse = require('./lib/defParser'),
    LogSave = require('./lib/logSave').LogSave


module.exports = function packetLogger(mod) {
    //For standalone env install express and replace these vars
    //const UI = require('express')
    //const ui = UI()
    //ui.listen(port, () => console.log(`Express listening on port ${port}`));
    const ui = new UI(mod),
        { command } = mod.require
    const tbox = typeof mod.compileProto === 'undefined';
    let packetBatchCache = [], protocolData

    if (tbox) protocolData = require('../../data/data.json')

    /*Setup WS and api server*/
    if(!fs.existsSync(path.join(__dirname, "savedData.json")))
        fs.writeFileSync(path.join(__dirname, "savedData.json"), JSON.stringify({savedFilters: {}}, null, 1))
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
        },
        maxLogSize = 200 //default size of 200 TODO: add static to settings object later
    const server = http.createServer().listen(0)
    const wsServer = new ws.Server({ server: server })
    // Websocket keep alive
    function heartbeat() {
        this.isAlive = true;
    }
    wsServer.on('connection', socket => {
        socket.isAlive = true;
        socket.on('pong', heartbeat)
        socket.send(JSON.stringify({
            syncState: {
                packets: packetCache.map((packet) => packet.name),
                filters,
                paused,
                logServer: logGroup.logServer,
                logClient: logGroup.logClient,
                maxLogSize
            }
        }))
    })
    const wsPing = setInterval(() => { //keepalive ping interval
        wsServer.clients.forEach((client) => {
            if (!client.isAlive) return client.terminate();
            client.isAlive = false;
            client.ping(() => { })
        });
    }, 30000)
    wsServer.on('close', () => {
        clearInterval(wsPing)
    })

    ui.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    ui.use(bodyParser.json({ limit: '50mb' }));

    let savedDataFile = path.join(__dirname, 'savedData.json')

    ui.use(UI.static(path.join(__dirname, 'build')))

    const batchPacketUpdates = setInterval(() => { //sending packets in batches as to not flood the UI's listener
        if (packetBatchCache.length > 0) {
            if (maxLogSize) { //false if no limit
                if (packetCache.length + packetBatchCache.length > maxLogSize) packetCache.splice(0, packetCache.length + packetBatchCache.length - maxLogSize) // max size 200
            }
            wsServer.clients.forEach((client) => {
                client.send(JSON.stringify({ packets: packetBatchCache.map((packet) => packet.name) }))
            })
            packetCache.push(...packetBatchCache)
            packetBatchCache = []
        }

    }, 100)
    function syncState() { //Probably a better way of handleing UI desyncronization
        wsServer.clients.forEach((client) => {
            client.send(JSON.stringify({
                syncState: {
                    packets: packetCache.map((packet) => packet.name),
                    filters,
                    paused,
                    logServer: logGroup.logServer,
                    logClient: logGroup.logClient,
                    maxLogSize
                }
            }))
        })
    }
    ui.post('/changeFilters', (req, res) => { //post add/remove filter
        if (req.body.entry) { //add filter
            filters[req.body.type].push(req.body.entry)
            filters[req.body.type].sort()
        } else { //remove filter
            filters[req.body.type].splice(req.body.index, 1)
        }
        res.json({})
        syncState();
    })
    ui.post('/clearFilters', (req, res) => {
        filters[req.body.type] = []
        res.json({})
        syncState();
    })
    ui.get('/pause', (req, res) => { //pause packet cap
        paused = !paused
        res.json({})
        syncState();
    })
    ui.post('/saveFilters', (req, res) => { //post save filters
        Object.assign(savedData.savedFilters, {
            [req.body.name]: {
                allowlist: [...filters.allowlist],
                blocklist: [...filters.blocklist]
            }
        })
        fs.writeFileSync(savedDataFile, JSON.stringify(savedData, (key, value) => typeof value === 'bigint' ? value.toString() + 'n' : value, '\t'))
        res.json({})
    })
    ui.get('/savedFilters', (req, res) => { //get saved filters list
        res.json(Object.keys(savedData.savedFilters))
    })
    ui.post('/loadFilters', (req, res) => { //get load filter
        filters = { //what a mutable nightmare
            allowlist: [...savedData.savedFilters[req.body.selectedTemplate].allowlist],
            blocklist: [...savedData.savedFilters[req.body.selectedTemplate].blocklist]
        }
        res.json({});
        syncState();
    })
    ui.post('/saveLogs', (req, res) => { //post save logs
        let serializedData = LogSave.serialize(packetCache)
        fs.writeFileSync(path.join(__dirname, 'logs', `${req.body.name}.bin`), serializedData)
        res.json({});
    })
    ui.get('/savedLogs', (req, res) => { //get saved logs list
        res.json(getLogs())
    })
    ui.post('/loadLogs', (req, res) => { //get load log
        paused = true //auto pause log when you load
        let logRead = new Uint8Array(fs.readFileSync(path.join(__dirname, 'logs', `${req.body.logname}`)))
        packetCache = LogSave.parse(logRead)
        res.json({});
        syncState();
    })
    ui.post('/deleteFromSaved', (req, res) => { //post delete from saved data add new delete for bin logs
        if (req.body.type === "savedLogs") {
            fs.unlinkSync(path.join(__dirname, 'logs', req.body.name))
            res.json(getLogs())

        } else if (req.body.type === "savedFilters") {
            delete savedData.savedFilters[req.body.name]
            fs.writeFileSync(savedDataFile, JSON.stringify(savedData, (key, value) => typeof value === 'bigint' ? value.toString() + 'n' : value, '\t'))
            res.json(Object.keys(savedData[req.body.type]))
        }
    })
    ui.post('/getHex', (req, res) => { //Hex Tool Call
        res.json(readHex(req.body.hexx.split(/\s|\n/g).join("")))
    })
    ui.post('/filterGroup', (req, res) => {
        logGroup = Object.assign(logGroup, req.body)
        res.json({})
        syncState();
    })
    ui.post('/getPacketData', (req, res) => {
        //parse def here
        const { name, code, version, data } = packetCache[req.body.index]
        let parsed = null,
            badDef = false,
            packetData, def
        if (tbox) {
            try {
                parsed = mod.dispatch.fromRaw(name, version, data)
            } catch (e) { badDef = true }

            //get def string
            try {
                def = Buffer.from(protocolData.protocol[`${name}.${version}.def`], 'base64').toString()
            } catch (e) { def = `No defintion found for packet: ${name}` }
        } else {
            try {
                parsed = mod.parse(code, version, data)
                badDef = mod.packetLength(code, version, parsed) !== data.length
            } catch (e) { badDef = true }

            //get def string
            const protocolPath = path.join(__dirname, '..', '..', 'node_modules', 'tera-data', 'protocol'),
                defPath = path.join(protocolPath, `${name}.${version}.def`)
            try {
                def = defParse(fs.readFileSync(defPath, 'utf-8'), protocolPath).join('\n')
            } catch (e) { def = `No defintion found for packet: ${name}` }
        }

        //build and send
        packetData = {
            ...packetCache[req.body.index], ...{
                data: parsed ? parsed : { Error: `Could not parse ${name}: No definition found.` },
                hex: data.toString('hex'),
                def,
                badDef
            }
        }
        let packetDataString = JSON.stringify(packetData, (key, value) =>
            typeof value === 'bigint' ? value.toString() + 'n' : value // serialize bigint as string
        )
        res.json(packetDataString)
    })
    ui.get('/clearLog', (req, res) => {
        packetCache = [];
        packetBatchCache = [];
        syncState();
        res.json({});
    })
    ui.get('/wsPort', (req, res) => {
        res.json({ port: server.address().port })
    })
    ui.post('/setMaxLogSize', (req, res) => {
        maxLogSize = req.body.size;
        res.json({});
        syncState();

    })
    //https://github.com/tera-mods/debug credit to Pinkie for original hook implementation
    const cache = []
    //hook original packets
    mod.hook('*', 'raw', { order: -Infinity }, (code, data) => {
        cache.push({ code, data: Buffer.from(data) })
    })
    //hook all packets after mods
    mod.hook('*', 'raw', {
        order: Infinity, filter: {
            // These need to go through so we can clean up from our previous hook, even if we're not logging them
            fake: null,
            modified: null,
            silenced: null
        }
    }, (code, data) => {
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
        let name, defVersion
        if (tbox) {
            try {
                let packetInfo = mod.dispatch.resolve(pkt.code)
                name = packetInfo.name
                defVersion = packetInfo.version
            } catch {
                name = `*${flags.incoming ? "SU" : "CU"}_NEEDS_REMAP_${pkt.code.toString(16).toString().toUpperCase()}`
                defVersion = 0
            }
        } else {
            name = mod.dispatch.protocol.packetEnum.code.get(pkt.code)
            let defs = name && mod.dispatch.protocol.constructor.defs.get(name)
            defVersion = defs && Math.max(...defs.keys())
            name = name ? name : `*${flags.incoming ? "SU" : "CU"}_NEEDS_REMAP_${pkt.code.toString(16).toString().toUpperCase()}`
        }
        //apply filters
        if (filters.allowlist.length > 0 && !filters.allowlist.includes(name)) return;
        if (filters.blocklist.includes(name)) return;
        if (!logGroup.logServer && flags.incoming) return;
        if (!logGroup.logClient && !flags.incoming) return;
        let packet = {
            code: pkt.code,
            name: name,
            version: defVersion,
            fake: flags.fake,
            data: pkt.data,
            timestamp: Math.round(Date.now() / 1000)
        }
        if (!paused) {
            packetBatchCache.push(packet)
        }

    }

    function readHex(hexx) {
        let hex = hexx.length % 2 > 0 ? "0" + hexx : hexx //byte pad
        let len = hex.length / 2 //len = byte length
        let buf = Buffer.alloc(0xFF) //initialize buffer
        try {
            buf.write(hex, 0, len, 'hex') //write hex
            if (len > 0xFF) throw "hex too large"
            if (hex.match(/[0-9a-f]+/i)[0] !== hex) throw "invalid hex"
        }
        catch (e) {
            if (e === "too long") return e
            return "invalid hex"
        }
        return {
            int16: len > 2 ? "overflow" : buf.readInt16LE().toString(),
            int32: len > 4 ? "overflow" : buf.readInt32LE().toString(),
            int64: len > 8 ? "overflow" : buf.readBigInt64LE().toString(),
            float: len > 4 ? "overflow" : buf.readFloatLE().toString(),
            double: len > 8 ? "overflow" : buf.readDoubleLE().toString(),
            string: buf.toString('ucs2', 0, len)
        }
    }
    function getLogs() {
        let logs = fs.readdirSync(path.join(__dirname, 'logs'))
        logs.splice(logs.indexOf(".gitignore"), 1)
        return logs
    }

    command.add('logger', {
        $default() {
            ui.open()
        }
    })

    this.destructor = () => { command.remove(['logger']) }
}