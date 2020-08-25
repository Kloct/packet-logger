import React from 'react';
import Draggable from 'react-draggable';
export default class SaveFilters extends React.Component {
  state = {
    templateName:""
  }
  toggleSaveLog(e) { // X Button
    e.preventDefault()
    this.props.toggleSaveLog()
  }
  submitSaveLog(e) {
    e.preventDefault()
    if(this.state.templateName!==""){
      this.props.saveLog(this.state.templateName)
      this.props.toggleSaveLog()
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
        defaultPosition={{ x: 0, y: 500 }}
        position={null}
        scale={1}
        onStart={this.handleStart}
        onDrag={this.handleDrag}
        onStop={this.handleStop}>
        <div className="popout">
          <div className="popoutX" onClick={(e) => this.toggleSaveLog(e)}>X</div>
          <div className="popouttitle">Save Log As:</div>
          <div style={{ padding:"15px" }}>
            <input style={{width: "200px"}}type="text" onChange={(e)=>this.handleChange(e)}></input>
          </div>
          <div style={{ padding:"15px", paddingTop:"0px", textAlign: "center" }}>
            <button onClick={(e)=>this.submitSaveLog(e)}>Save</button>
          </div>
        </div>
      </Draggable>
    )
  }
}