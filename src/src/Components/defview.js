import React from 'react';
import ReactJson from 'react-json-view';

export default class DefView extends React.Component{
  render(){
    let packetData, defTitle = ""
    if(this.props.data){ //TODO condition for empty object
      let {name, version, timestamp, fake, badDef, data} = this.props.data
      defTitle = `Defined View: [${new Date(timestamp*1000).toLocaleTimeString()}] ${name}${version&&version!==0?`.${version}`:""}${fake?"*":""} ${badDef?"(Bad Def)":""}`

      packetData = <ReactJson
      src={data}
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
    return(
      <div className="centerpanelsection">
        <div style={{backgroundColor: "#252526ff", height: "30px"}}>
          <div style={{float: "left"}}>{defTitle}</div>
        </div>
        <div style={{overflow: "scroll", overflowX: "hidden", height: "330px", width: "720px"}}>
          {packetData}
        </div>
      </div>
    )
  }
}