import React from 'react';
import '../App.css';
import TableData from './tableData'
import Checkbox from 'rc-checkbox'
import 'rc-checkbox/assets/index.css';

export default class FilterPane extends React.Component {
  constructor(){
    super()
    this.state = {
      selectSizeOpen: false
    }
  }
  handleRemoveFilter(list, i, e,){
    e.preventDefault()
    this.props.changeFilters(list, i)
  }
  toggleLoadFilters(e) {
    e.preventDefault()
    this.props.toggleLoadFilters()
  }
  toggleSaveFilters(e) {
    e.preventDefault()
    this.props.toggleSaveFilters()
  }
  loadDef(){ //TODO: opens load def window

  }
  filterGroup(e, group){
    this.props.filterGroup({[group]: e.target.checked})
  }
  handleSelectSizeOpen(e){
    e.preventDefault()
    this.setState({selectSizeOpen: !this.state.selectSizeOpen})
  }
  handleSelectSize(e){
    this.setState({selectSizeOpen: false})
    this.props.changeMaxLogSize(e)
  }
  render() {
    let selectSize,
      options=["200", "500", "1000", "Infinity"]
    if(this.state.selectSizeOpen){
      selectSize = 
        <ul className="selectItem">
          {options.map(opt=>
            <li value={opt} key={opt} onClick={(e)=>this.handleSelectSize(e)}>{`${opt}`}</li>
          )}
        </ul>
    }
    const {
      filters
    } = this.props
    return(
      <div className="filterpane">
        <p className="filtertitle">Allow Only List<button onClick={e=>this.handleRemoveFilter("allowlist", -1, e)}>Clear</button></p>
        <div style={{paddingLeft: "20px"}}>
          <div className="filtertablediv">
            {filters.allowlist?<FilterTable filters={filters.allowlist} removeFilter={(i, e)=>this.handleRemoveFilter("allowlist", i, e)}/>:" "}
          </div>
        </div>
        <p className="filtertitle">Blocklist<button onClick={e=>this.handleRemoveFilter("blocklist", -1, e)}>Clear</button></p>
        <div style={{paddingLeft: "20px"}}>
          <div className="filtertablediv">
            {filters.blocklist?<FilterTable filters={filters.blocklist} removeFilter={(i, e)=>this.handleRemoveFilter("blocklist", i, e)}/>:" "}
          </div>
        </div>
        <div style={{marginLeft:"10px"}}>
          <div style={{display: "table-cell", height: "40px", verticalAlign: "bottom"}}>
            <button style={{marginRight: "5px"}} onClick={e=>this.toggleSaveFilters(e)}>Save Filters</button>
            <button onClick={(e)=>this.toggleLoadFilters(e)}>Load Filters</button>
          </div>
          <div style={{marginLeft: "20px"}}>
            <div style={{marginTop:"10px", color: "white"}}><Checkbox checked={this.props.logClient} onChange={e=>this.filterGroup(e, "logClient")}/> Show Client Packets</div>
            <div style={{marginTop:"10px", color: "white"}}><Checkbox checked={this.props.logServer} onChange={e=>this.filterGroup(e, "logServer")}/> Show Server Packets</div>
            <hr style={{marginRight: "50px", opacity: "40%"}}/>
            <div style={{color: "white"}}>
              <div style={{float:"left"}}>Max Log Size</div>
              {selectSize}
              <button className="selectMain" onClick={(e)=>{this.handleSelectSizeOpen(e)}}>
                <div style={{float: "left"}}>{this.props.maxLogSize}</div>
                <div style={{float: "right"}}>^</div>
              </button>
            </div>

            <div style={{marginTop:"10px", color: "white"}}><Checkbox checked={this.props.autoScroll} onChange={this.props.toggleAutoScroll}/> Autoscroll</div>
          </div>
          
          
          {/*<div style={{marginTop:"20px"}}><button>Load Definition</button></div>*/}
        </div>
      </div>
    )
  }
}

class FilterTable extends React.Component {
	render(){
    const {
      filters,
      removeFilter
    } = this.props
		return(
			<table className="filtertable">
			  <tbody>
				{filters.map((filter, i)=>
					  <tr key={i}>
						<TableData value={filter} remove={(e) => removeFilter(i, e)}/>
					  </tr>
				  )}
			  </tbody>
			</table>
		)
	}
}