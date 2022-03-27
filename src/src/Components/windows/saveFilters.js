import React from 'react';
import Draggable from 'react-draggable';
export default class SaveFilters extends React.Component {
  state = {
    templateName:""
  }
  toggleSaveFilters(e) { // X Button
    e.preventDefault()
    this.props.toggleSaveFilters()
  }
  submitSaveFilters(e) {
    e.preventDefault()
    if(this.state.templateName!==""){
      this.props.saveFilters(this.state.templateName)
      this.props.toggleSaveFilters()
    }
    //what do if it is empty?
  }
  handleChange(e) { //for textarea
    e.preventDefault()
    this.setState({templateName: e.target.value})
  }
  render() {
    return (
      <Draggable
        handle=".popouttitle"
        defaultPosition={{ x: 500, y: 300 }}
        position={null}
        scale={1}
        onStart={this.handleStart}
        onDrag={this.handleDrag}
        onStop={this.handleStop}>
        <div className="popout">
          <div className="popoutX" onClick={(e) => this.toggleSaveFilters(e)}>X</div>
          <div className="popouttitle">Save Filters:</div>
          <div style={{ padding: "15px" }}>
            Save As:
            <input type="text" onChange={(e)=>this.handleChange(e)}></input>
            <button onClick={(e)=>this.submitSaveFilters(e)}>Save</button>
          </div>
        </div>
      </Draggable>
    )
  }
}