const UI = require('../ui');
module.exports = function proxypacketgui (mod) {
    const{ command } = mod.require,
    ui = UI(mod)

    let state = { packetCache: [], cacheSize: 200 }

    ui.use(UI.static(__dirname + '/ui'))

    command.add('logger', ()=>{
        ui.open()
    })
    this.destructor = () => { command.remove(['logger']) }
}