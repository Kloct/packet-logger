import React from 'react';
import { axios} from '../utils/api';
import '../App.css';
import LogPane from '../Components/logpane';
import FilterPane from '../Components/filterpane';
import DefView from '../Components/defview';
import HexView from '../Components/hexview';
import Definition from '../Components/windows/definition';
import HexTool from '../Components/windows/hextool';
import LoadFilters from '../Components/windows/loadFilters';
import SaveFilters from '../Components/windows/saveFilters';
import LoadLog from '../Components/windows/loadLog';
import SaveLog from '../Components/windows/saveLog';

export default class Main extends React.Component {
  constructor(){
    super()
    this.defaultState = {
      packets: [],
      filters: {
        allowlist: [],
        blocklist: [],
      },
      selectedPacketCache: undefined,
      savedFilters: [],
      savedLogs: [],
      selectedIndex: -1,
      defShowing: false,
      hexToolShowing: false,
      loadDefShowing: false,
      loadFiltersShowing: false,
      saveFiltersShowing: false,
      saveLogShowing: false,
      loadLogShowing: false,
      paused: false,
      def: "",
      logClient: true,
      logServer: true,
      autoScroll: true
    }
    this.state = this.defaultState
    
  }
  async componentDidMount(){
    axios.get('/wsPort')
    .then(res=>{
      let socket = new WebSocket(`ws://localhost:${res.data.port}`)
      socket.addEventListener('message', event => { //update packets from api
        let data = JSON.parse(event.data)
        if(data.packets){
          let trimmedPackets = this.state.packets,
            trimmed = false
          if (trimmedPackets.length+data.packets.length>200){
            trimmed = true
            trimmedPackets.splice(0, trimmedPackets.length+data.packets.length-200) // trim array if over max size of 200
          }
          this.setState(Object.assign(this.state, { packets: [...trimmedPackets, ...data.packets],  selectedIndex: trimmed?this.state.selectedIndex-1:this.state.selectedIndex}))
        } else if(data.syncState){
          this.setState(Object.assign(this.state, data.syncState))
        }
      })
    })
    
  }
  toggleDef(){
    if(!this.state.defShowing) this.setState({ defShowing: true });
    else this.setState({ defShowing: false });
  }
  toggleHexTool(){
    if(!this.state.hexToolShowing)this.setState({ hexToolShowing: true });
    else this.setState({ hexToolShowing: false });
  }
  selectIndex(i){
    axios.post('getPacketData', {index: i})
    .then((res)=>{
      this.setState({selectedPacketCache: JSON.parse(res.data)})
    })
    axios.post('/getDef', {name: this.state.packets[i]})
    .then((res)=>{
      this.setState(Object.assign(this.state, {
        selectedIndex: i,
        def: res.data.def
      }))
    })
  }
  checkFilter(){
    const {
      filters,
      selectedPacketCache
    } = this.state
    if(selectedPacketCache){
      if(filters.allowlist.indexOf(selectedPacketCache.string)>-1||filters.blocklist.indexOf(selectedPacketCache.string)>-1){
        return true
      }
      return false
    }
    return true
  }
  toggleSaveFilters(){
    if(!this.state.saveFiltersShowing)this.setState({ saveFiltersShowing: true });
    else this.setState({ saveFiltersShowing: false });
  }

  // All of these have api calls
  toggleLoadFilters(){
    if(!this.state.loadFiltersShowing) {
      axios.get('/savedFilters')
      .then((res)=>{
        this.setState(Object.assign(this.state, {savedFilters: res.data, loadFiltersShowing: true}));
      })
    } else
      this.setState({ loadFiltersShowing: false });
  }
  selectFilterTemplate(selectedTemplate){
    axios.post('/loadFilters', {selectedTemplate})
      .then((res)=>{
        this.setState(Object.assign(this.state, {loadFiltersShowing: false}))
        
      })
  }
  saveFilters(name){
    axios.post('/saveFilters', {name})
    .then(()=>{
      this.setState({saveFiltersShowing: false})
    })
  }
  saveLog(name){
    axios.post('/saveLogs', { name })
      .then(()=>{
        this.setState({saveLogShowing: false}) //close dialog
      })
    
  }
  loadLog(logname){
    axios.post('/loadLogs', {logname})
      .then(()=>{
        this.setState(Object.assign(this.state, {selectIndex: -1, def:""}))
      })
    this.logControlButton(4)
  }
  handleRemoveFilter(list, i){
    //Clear all filters
    if(i===-1) {
      axios.post('clearFilters', {
        type: list
      })
    } else {
      axios.post('/changeFilters', { //push changes
        type: list,
        index: i
      })
    }
    
    
  }
  handleAddFilter(list){
    axios.post('/changeFilters', { //push changes
      type: list,
      entry: this.state.packets[this.state.selectedIndex]
    })
  }
  logControlButton(buttonIndex){
    switch (buttonIndex){
      //1 Pause: Send request to stop sending new packets
      case 1: {
        axios.get('/pause')
        break;
      }
      //Clear: set state of packets to []
      case 2: {
        this.setState(Object.assign(this.state, {selectedIndex: -1, selectedPacketCache: undefined, def:""}))
        axios.get('/clearLog')
        break;
      }
      //Save request save current log to file
      case 3: {
        if(!this.state.saveLogShowing)this.setState({ saveLogShowing: true });
        else this.setState({ saveLogShowing: false });
        break;
      }
      //Load request load log from file list
      case 4: {
        if(!this.state.loadLogShowing) {
          axios.get('/savedLogs')
            .then((res)=>{
              this.setState(Object.assign(this.state, { savedLogs: res.data, loadLogShowing: true}))
            })
        } else this.setState({ loadLogShowing: false });
        break;
      }
      default: console.log("Invalid Button")
    }
  }
  deleteFromSavedData(type, name){
    axios.post('/deleteFromSaved', {type, name})
    .then(res=>{
      this.setState({ [type]: res.data })
    })
  }
  filterGroup(logGroup){
    this.setState(logGroup)
    axios.post('/filterGroup', logGroup)
  }
  toggleAutoScroll = ()=>{
    this.setState({autoScroll: !this.state.autoScroll})
  }


  render() {
    const{
      packets,
      filters,
      selectedIndex,
      savedFilters,
      savedLogs,
      def,
      selectedPacketCache,
      logClient,
      logServer,
      autoScroll,
    } = this.state
    let defview, hextool, loadFilters, saveFilters, saveLog, loadLog
    if(this.state.defShowing)defview = <Definition
      def={def}
      toggleDef={()=>this.toggleDef()}
    />
    if(this.state.hexToolShowing)hextool = <HexTool
      toggleHexTool={()=>this.toggleHexTool()}
    />
    if(this.state.loadFiltersShowing) loadFilters = <LoadFilters
      savedFilters={savedFilters}
      toggleLoadFilters={()=>this.toggleLoadFilters()}
      selectFilterTemplate={(selectedTemplate)=>this.selectFilterTemplate(selectedTemplate)}
      deleteFromSavedData={(name)=>this.deleteFromSavedData("savedFilters", name)}
    />
    if(this.state.saveFiltersShowing) saveFilters = <SaveFilters
      toggleSaveFilters={()=>this.toggleSaveFilters()} 
      saveFilters={(name)=>this.saveFilters(name)}
    />
    if(this.state.saveLogShowing) saveLog = <SaveLog
      toggleSaveLog={()=>this.logControlButton(3)}
      saveLog={(n)=>this.saveLog(n)}
    />
    if(this.state.loadLogShowing) loadLog = <LoadLog
      savedLogs={savedLogs}
      toggleLoadLog={()=>this.logControlButton(4)}
      loadLog={(n)=>this.loadLog(n)}
      deleteFromSavedData={(name)=>this.deleteFromSavedData("savedLogs", name)}
    />

    return(
      <div className="main">
        <LogPane
          toggleAutoScroll={this.toggleAutoScroll}
          autoScroll={autoScroll}
          packets={packets}
          selectIndex={(i)=>this.selectIndex(i)}
          selectedIndex={selectedIndex}
          logControlButton={(i)=>this.logControlButton(i)}
          paused={this.state.paused}
        />
        <div className="centerpanel">
          <DefView
            data={selectedPacketCache}
            handleAddFilter={(list)=>this.handleAddFilter(list)}
            filtered={this.checkFilter()}
            toggleDef={()=>this.toggleDef()}
          />
          <HexView
            data={selectedPacketCache}
            toggleHexTool={()=>this.toggleHexTool()}
          />
        </div>
        <FilterPane
          filters={filters}
          changeFilters={(list, i)=>this.handleRemoveFilter(list, i)}
          toggleLoadFilters={()=>this.toggleLoadFilters()}
          toggleSaveFilters={()=>this.toggleSaveFilters()}
          filterGroup={(group)=>this.filterGroup(group)}
          logClient={logClient}
          logServer={logServer}
        />
        {defview}
        {hextool}
        {loadFilters}
        {saveFilters}
        {saveLog}
        {loadLog}
      </div>
    )
  }
}