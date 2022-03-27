import React from 'react';
import Draggable from 'react-draggable';
import TableData from '../tableData';
export default class LoadFilters extends React.Component {
  toggleLoadFilters(e) {
    e.preventDefault()
    this.props.toggleLoadFilters()
  }
  selectFilterTemplate(e, template) {
    e.preventDefault()
    this.props.selectFilterTemplate(template)
  }
  removeFilterTemplate(e, name) {
    e.preventDefault()
    this.props.deleteFromSavedData(name)
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
          <div className="popoutX" onClick={(e) => this.toggleLoadFilters(e)}>X</div>
          <div className="popouttitle">Saved Filter Templates:</div>
          <div style={{ paddingLeft: "15px" }}>
            <div className="filtertablediv" style={{ height: "100px" }}>
              <table className="filtertable">
                <tbody>
                  {this.props.savedFilters.map((template, i)=>
                    <tr key={i}>
                      <TableData load={(e)=>this.selectFilterTemplate(e, template)} remove={(e)=>this.removeFilterTemplate(e, template)} value={template}/>
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