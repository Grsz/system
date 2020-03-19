import React from 'react';
import {aktdatum, todayOfWeek} from '../../Ido';
import './Naptar.css';
import FeladatEsemény from '../FeladatEsem\u00E9ny/FeladatEsem\u00E9ny';
import {connect} from 'react-redux';
import Nap from '../Nap/Nap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleRight, faAngleDoubleLeft } from '@fortawesome/free-solid-svg-icons';

class Naptar extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            todayDisplay: true,
            newEventName: '',
        }
    }

    ip(){
        const rows = (this.props.dayEnd - this.props.dayStart) / 6;
        const times = [];
        for(let i = 0; i <= rows; i += 2){
            times.push(
                <div className='timeWrapper' 
                    key={i}
                    style={{
                        order: i + 1, 
                        height: this.props.timeUnit * 2 + "px",
                        width: this.props.offsetX + "px"
                    }}>
                    <p className='hour'>
                        {(this.props.dayStart / 12) + (i / 2)}:00
                    </p>
                    <div className='calLineX'
                        style={{
                            left: this.props.offsetX,
                            top: this.props.timeUnit,
                            width: this.props.calDayW * 7
                        }}
                    ></div>
                </div>
            )
        }
        for(let i = 1; i < rows; i += 2){
            times.push(
                <div className='timeWrapper' 
                    key={i}
                    style={{
                        order: i + 1, 
                        height: this.props.timeUnit * 2 + "px",
                        width: this.props.offsetX + "px"
                    }}>
                    <p className='halfHour'>
                        {(this.props.dayStart / 12) + ((i - 1) / 2)}:30
                    </p>
                    <div className='halfCalLineX'
                        style={{
                            left: this.props.offsetX,
                            top: this.props.timeUnit,
                            width: this.props.calDayW * 7
                        }}
                    ></div>
                </div>
            )
        }
        return times
    }

    taskEventsPanel(){
        if(!this.props.taskEvents){return}
        const groups = Object.keys(this.props.taskEvents).map(group => {
            const tasks = this.props.taskEvents[group].map(task => {
                return <FeladatEsemény
                    key={task.id}
                    id={task.id}
                    name={task.name}
                    height={task.length * this.props.timeUnit * 4}
                    offsetX={this.props.offsetX}
                    offsetY={this.props.offsetY}
                    contHeight={this.props.calDayH}
                    contWidth={this.props.calDayW}
                    dayStart={this.props.dayStart}
                    timeUnit={this.props.timeUnit}
                    dayIndex={todayOfWeek} />
            })
            return <div className='taskEventsGroup' key={group}>
                {tasks}
                <h1>{group}</h1>
            </div>
        })
        return <div className='taskEventsPanel'>
            {groups}
        </div>
    }
    
    days = () => {
        if(!this.props.events){return}
        if(this.state.todayDisplay){
            return <Nap
                dayIndex={todayOfWeek}
                events={this.props.events[todayOfWeek]}
                breaks={this.props.breaks[todayOfWeek]}
                contiEvents={this.props.contiEvents[todayOfWeek]}
                today={true}
            />
        }
        return this.props.events.map((dayIndex, i) => {
            return <Nap
                dayIndex={i}
                events={dayIndex}
                breaks={this.props.breaks[i]}
                contiEvents={this.props.contiEvents[i]}
                />
                
        })
    }
    switchDisplay = (e) => {
        this.setState({
            todayDisplay: !this.state.todayDisplay
        })
    }
    render(){
        return(
            <div className='calendar'>
                <div className='displaySwitchButton' onClick={this.switchDisplay}>
                    <FontAwesomeIcon 
                        icon={this.state.todayDisplay ? faAngleDoubleRight : faAngleDoubleLeft}
                        size="3x"
                        color="rgb(42, 199, 139)"
                    />
                </div>
                <div className='timesContainer'
                    style={{marginTop: this.props.calHeaderH - this.props.timeUnit + "px"}}>
                    {this.ip()}
                </div>
                {this.days()}

                {this.state.todayDisplay && this.taskEventsPanel()}
            </div>
        )
    }
}
const mapStateToProps = (state, ownprops) => ({
    ...ownprops, 
    taskEvents: state.taskEvents,
    events: state.events,
    breaks: state.breaks,
    contiEvents: state.contiEvents,
    calDayH: (state.userData.dayEnd - state.userData.dayStart) * (state.dim.timeUnit / 3),
    calDayW: state.dim.calDayW,
    timeUnit: state.dim.timeUnit,
    calHeaderH: state.dim.calHeaderH,
    offsetY: state.dim.calHeaderH + state.dim.navH,
    offsetX: state.dim.timesW,
    dayStart: state.userData.dayStart,
    dayEnd: state.userData.dayEnd
})
export default connect(mapStateToProps)(Naptar);