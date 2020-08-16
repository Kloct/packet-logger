import React from 'react';
import ReactJson from 'react-json-view';

export default class DefView extends React.Component{
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
  render(){
    let packetName, packetData, packetVersion
    if(this.props.data){ //TODO condition for empty object
      packetName = this.props.data.string;
      packetVersion = this.props.data.version;
      packetData = <ReactJson
      src={this.props.data.data}
      theme={{
        base00:"#1e1e1eff",
        base01:"#383830",
        base02:"#49483e",
        base03:"#75715e",
        base04:"#a59f85",
        base05:"#f8f8f2",
        base06:"#f5f4f1",
        base07:"#f9f8f5",
        base08:"#f92672",
        base09:"#fd971f",
        base0A:"#f4bf75",
        base0B:"#a6e22e",
        base0C:"#a1efe4",
        base0D:"#66d9ef",
        base0E:"#ae81ff",
        base0F:"#cc6633"
      }}
      shouldCollapse={e=>e.name==="root"?false:true}
      enableClipboard={false}
      displayDataTypes={false}
    />
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
    </div>
    return(
      <div className="centerpanelsection">
        <div style={{backgroundColor: "#252526ff", height: "30px"}}>
    <div style={{float: "left"}}>Defined View {this.props.data?`${packetName}.${packetVersion}`:""}</div>
          <div style={{float: "right"}}>{buttons}</div>
        </div>
        <div style={{overflow: "scroll", overflowX: "hidden", height: "330px", width: "720px"}}>
          {packetData}
        </div>
      </div>
    )
  }
}