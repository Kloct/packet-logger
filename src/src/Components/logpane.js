import React from 'react';
import '../App.css';

export default class LogPane extends React.Component {
  scrollToBottom(){
    this.messageEnd.scrollIntoView()
  }
  componentDidMount(){
    if(this.props.autoScroll)
      this.scrollToBottom()
  }
  componentDidUpdate(){
    if(this.props.autoScroll)
      this.scrollToBottom()
  }
  controlButton(e, index){
    e.preventDefault()
    this.props.logControlButton(index)
  }
  selectIndex(i, e) {
    e.preventDefault()
    this.props.selectIndex(i)
  }
  render() {
    const {
      packets,
      selectedIndex,
      paused
    } = this.props
    return (
      <div className="logpane">
        <div className="logpanecontent">
          {/*Main Table*/}
          <table className="logtable">
            <tbody>
              {packets.map((packet, i) =>
                <tr key={i}>
                  <td onClick={(e) => this.selectIndex(i, e)} className={i === selectedIndex ? "logpaneselected" : ""}>{packet}</td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{float: "left", clear: "both"}} ref={(el)=>{this.messageEnd = el}}></div>{/*Dummy element for autoscrolling*/}
        </div>
        <div className="logpanebuttons">
          <div className="logpaneimgcontainer" style={{opacity: paused?1:0.5}} onClick={(e)=>this.controlButton(e, 1)}><img src={process.env.PUBLIC_URL + "/play-pause.png"} alt="" /></div>
          <div className="logpaneimgcontainer" onClick={(e)=>this.controlButton(e, 2)}><img src={process.env.PUBLIC_URL + "/clear.png"} alt="" /></div>
          <div className="logpaneimgcontainer" onClick={(e)=>this.controlButton(e, 3)}><img src={process.env.PUBLIC_URL + "/save.png"} alt="" /></div>
          <div className="logpaneimgcontainer" onClick={(e)=>this.controlButton(e, 4)}><img src={process.env.PUBLIC_URL + "/open.png"} alt="" /></div>
        </div>
      </div>
    )
  }
}