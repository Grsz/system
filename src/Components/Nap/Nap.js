import React from 'react';
import Esemény from '../Esem\u00E9ny/Esem\u00E9ny';
import {datesOfWeek, hónapok, napok} from '../../Ido';
import {connect} from 'react-redux';
import Break from '../Break/Break'
import { newEvent } from '../../Firebase';
import './Nap.css'
const initial = {
    top: 0,
    bot: 0,
    display: 'none',
}
const red = "red";
const green = "rgba(42, 200, 139, 0.8)";

class Nap extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            top: 0,
            bot: 0,
            newEventName: '',
            color: green,
            initial: Object.assign({}, initial),
        };
    }
    indexToDay = datesOfWeek[this.props.dayIndex];
    isDragging = false;
    preventDragging = false;
    timeout;
    pxToTime = (px) => {
        return Math.round(px / this.props.timeUnit * 3) + this.props.dayStart;
    }
    checkOverlap = (end) => {
        const conditions = (e) => 
            ((e.rTop || e.top) > end && (e.rBot || e.bot) > end) ||
            ((e.rTop || e.top) < end && (e.rBot || e.bot) < end)
        return this.props.events.every(e => conditions(e)) && 
        (this.props.breaks.length ? this.props.breaks.every(b => conditions(b)) : true)
    }
    onDown = e => {
        const top = Math.round((e.pageY - this.props.offsetY) / this.props.timeUnit) * this.props.timeUnit;
        if(!this.preventDragging && this.checkOverlap(top)){
            this.timeout = setTimeout(() => {
                if(!this.preventDragging){
                    this.isDragging = true;
                    this.setState({top})
                }
            }, 300);
        }
    }
    onMove = e => {
        const bot = e.pageY - this.props.offsetY < this.state.top ? 0 : e.pageY - this.props.offsetY;
        if(!this.isDragging){return}
        if(this.checkOverlap(bot)){
            this.setState({color: green})
        } else {
            this.setState({color: red})
        }
        this.setState({
            bot
        })
    }
    onUp = e => {
        clearTimeout(this.timeout)
        if((!this.preventDragging && this.isDragging) && this.checkOverlap(this.state.bot)){
            this.setState({
                ...this.state,
                top: 0,
                bot: 0,
                initial: {
                    ...this.state.initial,

                    top: this.state.top,
                    bot: Math.floor(this.state.bot / this.props.timeUnit) * this.props.timeUnit,
                    display: 'flex'
                }
            })
            this.isDragging = false;
            this.preventDragging = true;
        } else {
            this.setState({
                ...initial
            })
            this.isDragging = false;

        }
    }
    createNewEvent = () => {
        if(Boolean(this.state.newEventName)){
            newEvent(
                this.state.newEventName,
                this.indexToDay + "", 
                this.pxToTime(this.state.initial.top),
                this.pxToTime(this.state.initial.bot)
            );
            this.setState({
                ...this.state,
                newEventName: '',
                initial: {
                    ...this.state.initial,
                    ...initial
                }
            })
            this.preventDragging = false
        }
    }
    cancelCreateNewEvent = () => {
        this.setState({
            ...this.state,
            newEventName: '',
            initial: {
                ...this.state.initial,
                ...initial
            }
        })
        this.preventDragging = false
    }
    newEventName = e => {
        this.setState({
            newEventName: e.target.value
        })
    }
    outerEvent = () => {
        this.preventDragging = !this.preventDragging
    }
    events = (array) => {
        if(!array){return}
        return array.map(event => {
            return <Esemény
                id={event.id}
                name={event.name}
                taskId={event.taskId}

                top={event.top}
                bot={event.bot}
                height={event.height || event.bot - event.top}

                rTop={event.rTop}
                rBot={event.rBot}
                rHeight={event.rBot - event.rTop}

                event={this.outerEvent}

                offsetY={this.props.offsetY}
                width={this.props.calDayW}
                timeUnit={this.props.timeUnit}

                dayStart={this.props.dayStart}
                dayIndex={this.props.dayIndex}
            />
        })
    }
    breaks = () => {
        if(!this.props.breaks){return}
        return this.props.breaks.map(br => {
            return <Break
                name={br.name}
                top={br.top}
                bot={br.bot || this.props.time}
            />
        })
    }
    outerEvent = () => {
        this.preventDragging = !this.preventDragging
    }
    initialBreak = () => {
        const top = this.props.lastEventBot,
            bot = this.props.time;
            console.log(top, bot)
        if(bot - top > this.props.timeUnit / 3){
            return <Break
                name='Szünet'
                top={top}
                bot={bot}
            />
        }
    }
    header(){
        const month = hónapok[this.indexToDay.getMonth()];
        const day = napok[this.props.dayIndex];
        const date = this.indexToDay.getDate();
        return <div className='calDate'
            style={{height: this.props.calHeaderH + "px"}}>
                <p>{month}</p>
                <p>{date}</p>
                <p>{day}</p>
            </div>
    }
    render(){
        return(
            <div className='day'>
                {this.header()}
                <div className='events'
                style={{height: this.props.calDayH + "px", width: this.props.calDayW + "px"}}
                onPointerDown={this.onDown}
                onPointerMove={this.onMove}
                onPointerUp={this.onUp}
                onPointerCancel={this.onUp}
                >
                    <div style={{
                            top: this.state.top,
                            height: this.state.bot - this.state.top,
                            display: this.isDragging ? 'block' : 'none',
                            backgroundColor: this.state.color
                        }}
                        className='event készítésnél'
                    ></div>
                    <div style={{
                            top: this.state.initial.top + 'px',
                            height: this.state.initial.bot - this.state.initial.top + 'px',
                            display: this.state.initial.display
                        }} 
                        className='event véglegesítésnél'
                    >
                        <input 
                            type='text' 
                            className='newEventName'
                            placeholder='Esemény neve'
                            name='eseményNév'
                            onChange={this.newEventName}
                            value={this.state.newEventName}
                            autoFocus
                        /> 

                        <div className='eventButtons'>
                            <div className='eventButton' onClick={this.createNewEvent}>Ok</div>
                            <div className='eventButton' onClick={this.cancelCreateNewEvent}>Mégse</div>
                        </div>
                    </div>
                    {this.events(this.props.events)}
                    {this.events(this.props.contiEvents)}
                    {this.breaks()}
                    {(this.props.today && this.props.lastEventBot) && 
                        this.initialBreak()}
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state, ownprops) => ({
    ...ownprops,
    calDayH: (state.userData.dayEnd - state.userData.dayStart) * (state.dim.timeUnit / 3),
    calDayW: state.dim.calDayW,
    offsetY: state.dim.calHeaderH + state.dim.navH,
    calHeaderH: state.dim.calHeaderH,
    offsetX: state.dim.timesW,
    dayStart: state.userData.dayStart,
    dayEnd: state.userData.dayEnd,
    timeUnit: state.dim.timeUnit,
    lastEventBot: state.query.lastEventBot,
    time: state.timePx
})

export default connect(mapStateToProps)(Nap)