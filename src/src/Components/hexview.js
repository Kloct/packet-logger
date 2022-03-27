import React from 'react';

export default class HexView extends React.Component {
  hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
      if (i % 40 === 0 && i !== 0) str += "\n" //add break every 40 hex
      var hexbyte = parseInt(hex.substr(i, 2), 16)
      if (hexbyte > 32 && hexbyte < 127) str += String.fromCharCode(hexbyte);
      else str += ".";
      //if(i%8===0) str += " " //add space every 8 hex
      
    }
    return str;
  }
  formatHex(hex) {
    var str = ''
    //every x bytes
    for (var i = 0; i < hex.length; i += 8) {
      if (i % 40 === 0 && i !== 0) str += "\n" //add break every 40 hex
      str += hex.substr(i, 8) + " "
    }
    return str;
  }
  toggleHexTool(e) {
    e.preventDefault()
    this.props.toggleHexTool()
  }
  allowOnlyPacket(e){
    e.preventDefault()
    this.props.handleAddFilter("allowlist")
  }
  blockPacket(e){
    e.preventDefault()
    this.props.handleAddFilter("blocklist")
  }
  toggleDef(e){
    e.preventDefault()
    this.props.toggleDef()
  }
  render() {
    let hexViewContent, button
    if (this.props.data) {
      hexViewContent = <div>
        <pre style={{ float: "left" }}>{this.formatHex(this.props.data.hex)}</pre>
        <pre style={{ float: "right" }}>{this.hex2a(this.props.data.hex)}</pre>
      </div>
    }
    const buttons = <div>
      <button
        className="contentpanelbutton"
        onClick={(e)=>this.allowOnlyPacket(e)}
        disabled={this.props.filtered}
      >Allow Only</button>
      <button
        className="contentpanelbutton"
        onClick={(e)=>this.blockPacket(e)}
        disabled={this.props.filtered}
      >Block</button>
      <button
        className="contentpanelbutton"
        onClick={(e)=>this.toggleDef(e)}
        disabled={this.props.data?false:true}
      >Definition</button>
      <button
        className="contentpanelbutton" 
        onClick={(e) => this.toggleHexTool(e)}
      >HexTool</button>
    </div>
    return (
      <div className="centerpanelsection">
        <div style={{backgroundColor: "#252526ff", height: "30px"}}>
          <div style={{ float: "left" }}>Hex View</div>
          <div style={{ float: "right" }}>
            {buttons}
          </div>
        </div>
        <div style={{overflow: "scroll", overflowX: "hidden", height: "330px", width: "720px"}}>
          {hexViewContent}
        </div>
      </div>
    )
  }
}