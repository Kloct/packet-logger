import React from 'react';
export default class TableData extends React.Component{
    state = {hover: false}
  
    onMouseEnter = () =>{
      this.setState({hover:true})
    }
    onMouseLeave = () =>{
      this.setState({hover:false})
    }
    render(){
      const {
        value,
        remove,
        load,
      } = this.props
      return(
        <td onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
          <div style={{float: "left", cursor: load?"pointer":"unset", width:"200px", textOverflow:"ellipsis", overflow: "hidden", display:"inline-block", whiteSpace:"nowrap"}} onClick={load?load:()=>{}}>
            {value}
          </div>
          <div style={{float: "right", display: this.state.hover?"block":"none", cursor: "pointer", fontWeight: "bold"}} onClick={remove}>
            X
          </div>
        </td>
      )
    }
  }