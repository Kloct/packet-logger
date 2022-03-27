import React from 'react';
import Draggable from 'react-draggable';
export default class Definition extends React.Component{
  toggleDef(e){
    e.preventDefault()
    this.props.toggleDef()
  }
  render(){
    return(
      <Draggable
        handle=".popouttitle"
        defaultPosition={{x: 600, y: 90}}
        position={null}
        scale={1}
        onStart={this.handleStart}
        onDrag={this.handleDrag}
        onStop={this.handleStop}>
        <div className="popoutresizeable">
          <div>
            <div className="popoutX" onClick={(e)=>this.toggleDef(e)}>
              X
            </div>
            <div className="popouttitle">
              Definition
            </div>
          </div>
          <div className="popoutcontent">
              {this.props.def}
          </div>
        </div>
      </Draggable>
    )
  }
}