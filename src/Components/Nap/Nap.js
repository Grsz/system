import React from 'react';
import Esemény from '../Esem\u00E9ny/Esem\u00E9ny';
import {datesOfWeek, hónapok, napok} from '../../Ido';
import {connect} from 'react-redux';
import Break from '../Break/Break'
import { newEvent } from '../../Firebase';
import './Nap.css'
import { faThumbsDown } from '@fortawesome/free-solid-svg-icons';
const initial = {
    top: 0,
    bot: 0,
    display: 'none',
}
class Nap extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            top: 0,
            bot: 0,
            newEventName: '',
            initial: Object.assign({}, initial),
        };
    }
    indexToDay = datesOfWeek[this.props.dayIndex];
    isDragging = false;
    preventDragging = false;
    timeout;
    pxToTime = (px) => {
        return (Math.round(px / this.props.timeUnit) * 3) + this.props.dayStart;
    }
    onDown = e => {
        const top = Math.round((e.pageY - this.props.offsetY) / this.props.timeUnit) * this.props.timeUnit;

        const checkOverlap = () => {
            const conditions = (e) => 
                ((e.rTop || e.top) > top && (e.rBot || e.bot) > top) ||
                ((e.rTop || e.top) < top && (e.rBot || e.bot) < top)
            return this.props.events.every(e => conditions(e)) && 
            (this.props.breaks.length ? this.props.breaks.every(b => conditions(b)) : true)
        }
        console.log(checkOverlap(), top, this.props.events)
        if(!this.preventDragging && checkOverlap()){
            this.timeout = setTimeout(() => {
                if(!this.preventDragging){
                    this.isDragging = true;
                    this.setState({top})
                }
            }, 300);
        }
    }
    onMove = e => {
        if(!this.isDragging){return}
        const bot = e.pageY - this.props.offsetY < this.state.top ? 0 : e.pageY - this.props.offsetY;
        this.setState({
            bot
        })
    }
    onUp = e => {
        clearTimeout(this.timeout)
        if(!this.preventDragging && this.isDragging){
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
    events = () => {
        if(!this.props.events){return}
        return this.props.events.map(event => {
            return <Esemény
                id={event.id}
                name={event.name}
                taskId={event.taskId}

                top={event.top}
                bot={event.bot}
                height={event.bot - event.top}

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
                            display: this.isDragging ? 'block' : 'none'
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
                    {this.events()}
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