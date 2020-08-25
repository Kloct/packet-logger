import React from 'react';
import Draggable from 'react-draggable';
import TableData from '../tableData';
export default class loadLog extends React.Component {
  toggleLoadLog(e) {
    e.preventDefault()
    this.props.toggleLoadLog()
  }
  loadLog(e, name) {
    e.preventDefault()
    this.props.loadLog(name)
  }
  removeLog(e, name) {
    e.preventDefault()
    this.props.deleteFromSavedData(name)
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
          <div className="popoutX" onClick={(e) => this.toggleLoadLog(e)}>X</div>
          <div className="popouttitle">Saved Packet Logs:</div>
          <div style={{ paddingLeft: "15px" }}>
            <div className="filtertablediv" style={{ height: "100px" }}>
              <table className="filtertable">
                <tbody>
                  {this.props.savedLogs.map((template, i)=>
                    <tr key={i}>
                      <TableData load={(e)=>this.loadLog(e, template)} remove={(e)=>this.removeLog(e, template)} value={template}/>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Draggable>
    )
  }
}