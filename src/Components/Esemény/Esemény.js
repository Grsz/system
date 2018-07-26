import React from 'react';
import './Esemény.css';
import Rnd from 'react-rnd';
import {connect} from 'react-redux';
import {changeEvent, deleteEvent} from '../../Firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
const initialColor = 'rgba(42, 255, 139, 0.6)',
correctColor = 'rgba(42, 218, 139, 0.6)',
wrongColor = 'rgba(237, 28, 36, 0.6)';
class Esemény extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            top: this.props.top,
            bot: this.props.bot,
            initialTop: 0,
            initialBot: 0,
            color: initialColor
        }
    }
    eventInProgress = false;
    extendsProps = {
        id: this.props.id
    }

    pxToTime = (px) => {
        return (Math.round(px / this.props.timeUnit) * 3) + this.props.dayStart;
    }

    eventStart = () => {
        this.props.event();
        this.eventInProgress = true;
        this.setState({
            initialBot: this.props.bot,
            initialTop: this.props.top
        })
    }

    checkOverlap = (top, bot) => 
        this.props.events[this.props.dayIndex]
        .filter(e => e.id !== this.props.id)
        .every(e => (e.top < top + 5 && e.bot < top + 5)||(e.top + 5 > top && e.top + 5 > bot))
    

    resize = (e, dir, ref, delta) => {
        const top = dir === 'top' ? this.props.top - delta.height : this.props.top;
        const bot = dir === 'bot' ? this.props.bot + delta.height : this.props.bot
        if(this.checkOverlap(top, bot)){
            this.setState({
                color: correctColor
            })
        } else {
            this.setState({
                color: wrongColor
            })
        }
        if(dir === 'top'){
            this.setState({
                ...this.state,
                initialTop: this.props.top - delta.height
            })
        }
        else if(dir === 'bottom'){
            this.setState({
                ...this.state,
                initialBot: this.props.bot + delta.height
            })
        }
    }
    drag = (e, dir) => {
        const top = dir.y;
        const bot = dir.y + (this.props.bot - this.props.top);
        if(this.checkOverlap(top, bot)){
                this.setState({
                    color: correctColor
                })
            } else {
                this.setState({
                    color: wrongColor
                })
            }
    }
    dragEnd = (e, dir) => {
        this.setState({color: initialColor});
        const top = dir.y;
        const bot = dir.y + (this.props.bot - this.props.top);
        this.eventInProgress = false;
        this.props.event();
        if(this.checkOverlap(top, bot)){
            changeEvent(this.props.id, this.pxToTime(top), this.pxToTime(bot))
        } else {
            this.setState({
                initialTop: this.props.top,
                initialBot: this.props.bot
            })
        }
    }
    resizeEnd = (e, dir, ref, delta) => {
        const handleResize = (t, b) => {
            const top = this.props.top - t;
            const bot = this.props.bot + b;
            this.eventInProgress = false;
            this.props.event();
            if(this.checkOverlap(top, bot)){
                changeEvent(this.props.id, this.pxToTime(top), this.pxToTime(bot))
                this.setState({
                    color: initialColor
                })
            } else {
                this.setState({
                    initialTop: this.props.top,
                    initialBot: this.props.bot,
                    color: initialColor
                })
            }
        }
        if(dir === 'top'){
            handleResize(delta.height, 0)
        } else if (dir === 'bottom'){
            handleResize(0, delta.height)
        }
    }
    
    deleteEvent = () => {
        deleteEvent(this.props.id, this.props.taskId)
        this.props.dispatch({
            type: 'REMOVE_EVENT',
            id: this.props.id,
            index: this.props.dayIndex
        })
        this.props.dispatch({type: 'GET_EVENT_QUERY'})
    }
    height = () => {
        if(this.props.rTop && this.props.rBot){
            return this.props.rHeight
        } else if(this.eventInProgress){
            return this.state.initialBot - this.state.initialTop
        } else {
            return this.props.height || 0
        }
    }
    top = () => {
        if(this.props.rTop){
            return this.props.rTop
        } else if(this.eventInProgress){
            return this.state.initialTop
        } else {
            return this.props.top
        }
    }
    render(){
        return(
            <Rnd className='event'
                style={{
                    backgroundColor: this.state.color,
                    zIndex: 'auto'
                }}
                size={{
                    width: "100%", 
                    height: this.height()
                }}
                position={{
                    x: 0, 
                    y: this.top()
                }}
                bounds='.events'
                dragAxis='y'
                onResizeStart={this.eventStart}
                onDragStart={this.eventStart}
                onResize={this.resize}
                onResizeStop={this.resizeEnd}
                onDrag={this.drag}
                onDragStop={this.dragEnd}
                extendsProps={this.extendsProps}
                cancel='.deleteButton'
                disableDragging={this.props.rTop ? true : false}
                enableResizing={{
                    top: this.props.taskId || this.props.rTop ? false : true,
                    bottom: this.props.taskId || this.props.rTop ? false : true,
                    right: false,
                    left: false,
                    topLeft: false,
                    topRight: false,
                    bottomLeft: false,
                    bottomRight: false
                }}
            >
                {!this.props.rTop && 
                    <div 
                        id={this.props.id} 
                        className='deleteButton' 
                        onClick={this.deleteEvent}
                    >
                        <FontAwesomeIcon icon={faTrashAlt} color="white" />
                    </div>
                }

                {(this.props.rTop && !this.props.rBot) ?
                    <div
                        className='eventInProgress'
                        style={{
                            height: this.props.time ? 
                            this.props.time - this.props.rTop : 0,
                            backgroundColor: this.props.time - this.props.rTop > this.props.height ?
                            'red' : 'green',
                        }}
                    >
                        <p className='eventName'>{this.props.name}</p>
                    </div>
                :
                    <p className='eventName'>{this.props.name}</p>
                }

                {(this.props.rTop && this.props.rBot) && 
                    <div 
                        className='overTime'
                        style={{
                            height: this.props.rHeight > this.props.height ?
                                this.props.rHeight - this.props.height : 0
                        }}
                    >
                    </div>
                }
            </Rnd>
        )
    }
}
const mapStateToProps = (state, ownprops) => ({
    ...ownprops, 
    events: state.events,
    time: state.timePx
})
export default connect(mapStateToProps)(Esemény);