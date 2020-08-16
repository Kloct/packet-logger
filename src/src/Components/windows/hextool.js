import React from 'react';
import { axios } from '../../utils/api';
import Draggable from 'react-draggable';


export default class HexTool extends React.Component {
  state = {
    input: "",
    output: { int16: "", int32: "", int64: "", float: "", double: "", string: "" }
  }
  toggleHexTool(e) {
    e.preventDefault()
    this.props.toggleHexTool()
  }
  handleChange(e) {
    console.log(e.target.value)
    axios.post('/getHex', {hexx: e.target.value})
      .then(res=>{
        if(typeof converted === "string"){

        } else this.setState({ output: res.data })
      })
  }
  render() {
    const {
      state
    } = this
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
          <div className="popoutX" onClick={(e) => this.toggleHexTool(e)}>X</div>
          <div className="popouttitle">Hex Tool LE</div>
          <div className="hextool">
            <div style={{ float: "left" }}>
              <p style={{ margin: "5px"}}>Input Hex:</p>
              <textarea onChange={this.handleChange.bind(this)} />
            </div>
            <div style={{ float: "right" }}>
              <pre className="hextoolresults">{state.output.int16}</pre>
              <pre className="hextoolresults">{state.output.int32}</pre>
              <pre className="hextoolresults">{state.output.int64}</pre>
              <pre className="hextoolresults">{state.output.float}</pre>
              <pre className="hextoolresults">{state.output.double}</pre>
            </div>
            <div style={{ float: "right" }}>
              <p>INT16</p>
              <p>INT32</p>
              <p>INT64</p>
              <p>FLOAT</p>
              <p>DOUBLE</p>
            </div>
            <p style={{ paddingTop: "210px" }}>STRING</p>
            <pre className="hextoolresultstring">{state.output.string}</pre>
          </div>
        </div>
      </Draggable>
    )
  }
}