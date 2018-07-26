import React from 'react';
import Rnd from 'react-rnd';
import {today} from '../../Ido';
import { connect } from 'react-redux';
import { newEvent } from '../../Firebase';

const initialColor = 'rgb(42, 255, 139)',
draggingColor = 'rgb(42, 242, 139)',
correctColor = 'rgb(42, 218, 139)',
wrongColor = 'rgb(237, 28, 36)';

class FeladatEsemény extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            height: "50%",
            width: "80%",
            color: initialColor
        }
    }
    checkOverlap = (top, bot) => 
        this.props.events[this.props.dayIndex]
        .every(e => (e.top < top + 5 && e.bot < top + 5)||(e.top + 5 > top && e.top + 5 > bot));
    
    checkXAxis = xPos => xPos > this.props.offsetX && xPos < this.props.offsetX + this.props.contWidth;

    checkYAxis = (top, bot) => top > 0 && bot < this.props.contHeight

    pxToTime = (px) => {
        return (Math.round(px / this.props.timeUnit) * 3) + this.props.dayStart;
    }
    dragStop = (e, x) => {
        const wM = window.scrollY;
        const elemDims = x.node.getBoundingClientRect();
        const top = elemDims.top - this.props.offsetY + wM;
        const bot = elemDims.bottom - this.props.offsetY + wM;
        const height = elemDims.height;
        const xPos = e.pageX;
        if((this.checkXAxis(xPos) && this.checkYAxis(top, bot)) && this.checkOverlap(top, bot)){
            const elemTop = this.pxToTime(top);
            const elemBot = this.pxToTime(bot);
            newEvent(this.props.name, today+"", elemTop, elemBot, this.props.id)
        } else {
            this.setState({height: "50%", width: "80%", color: initialColor});
            this.rnd.updatePosition({ x: 0, y: 0 });
        }
    }
    dragging = (e, x) => {
        const wM = window.scrollY;
        const elemDims = x.node.getBoundingClientRect()
        const top = elemDims.top - this.props.offsetY + wM;
        const bot = elemDims.bottom - this.props.offsetY + wM;
        const xPos = e.pageX;
        if(this.checkXAxis(xPos)){
            if(this.checkYAxis(top, bot)){
                if(this.checkOverlap(top, bot)){
                    this.setState({
                        color: correctColor
                    })
                    
                } else {
                    this.setState({
                        color: wrongColor
                    })
                }
            } else {
                this.setState({
                    color: wrongColor
                })
            }
        } else {
            this.setState({
                color: draggingColor
            })
        }
    }
    dragStart = () => {
        console.log(this.props.contWidth)
        this.setState({
            height: this.props.height, 
            width: this.props.contWidth
        })
    }
    render(){
        return(
                <Rnd 
                    style={{
                        backgroundColor: this.state.color,
                        position: 'absolute',
                        top: '20%',
                        boxSizing: 'border-box'
                    }}
                    className='feladatEsemény'
                    size={{
                        width: this.state.width,
                        height: this.state.height
                    }}
                    onDragStart={this.dragStart}
                    onDrag={this.dragging}
                    onDragStop={this.dragStop}
                    ref={c => { this.rnd = c; }}
                    enableResizing={{
                        top: false,
                        bot: false,
                        right: false,
                        left: false,
                        topLeft: false,
                        topRight: false,
                        bottomLeft: false,
                        bottomRight: false
                    }}
                >
                    <p style={{textAlign: 'center', marginTop: '10%'}}>     {this.props.name}
                    </p>
                </Rnd>
        )
    }
}
const mapStateToProps = (state, ownprops) => ({
    ...ownprops, 
    events: state.events,
})
export default connect(mapStateToProps)(FeladatEsemény);