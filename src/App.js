import React, { Component } from 'react';
import './App.css';
import Feladatlista from './Components/Feladatlista/Feladatlista';
import Idovonal from './Components/Idovonal/Idovonal';
import Naptar from './Components/Naptar/Naptar';
import Takaro from './Components/Takaro';
import { DragDropContext } from 'react-beautiful-dnd';
import {connect} from 'react-redux';
import logo from './Components/logo.png';
import {today} from './Ido';
import { setInterval } from 'timers';
import {setTime, wDim, getEventsOfWeek, getTasks, changeRanks, eventStarted, breakStarted, breakCompleted, eventCompleted} from './Firebase';

const desktop = {
  navH: 80,
  calHeaderH: 80,
  timeUnit: 10,
  calDayW: 200,
  timesW: 100,
}

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      display: 'idovonal'
    }
    this.onDragEnd = this.onDragEnd.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }
  counter;

  pxToTime = (px) => {
      return (Math.round(px / this.props.timeUnit) * 3) + this.props.dayStart;
  }

  timeToPx = (time) => {
      return (time - this.props.dayStart) * this.props.timeUnit / 3
  }

  componentWillMount(){
    this.props.getEventsOfWeek();
    this.props.getTasks();
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
    this.props.setTime(today.getDate(), this.state.óra, this.state.perc);
    this.counter = setInterval(() => this.props.setTime(today.getDate(), this.state.óra, this.state.perc), 300);
  }
  
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }
  
  updateWindowDimensions() {
    this.props.wDim(desktop, window.innerWidth)
  }
  reorder = (dragItemId, startIndex, endIndex) => {
    const dragElem = this.props.tasks.find(elem => dragItemId === elem.id);

    const list = this.props.tasks
      .filter(elem => elem.pId === dragElem.pId)
      .sort((a, b) => a.rank - b.rank);

    const [removed] = list.splice(startIndex, 1);
    list.splice(endIndex, 0, removed);
    changeRanks(list);
  }

  onDragEnd(result) {
    if (!result.destination) {
      return;
    }
    this.reorder(
      result.draggableId,
      result.source.index,
      result.destination.index
    )
  }

  menuChange = (content) => {
    this.setState({display: content})
  }

  menurender = () => {
    if(this.state.display === 'feladatlista'){
      return <Feladatlista 
      type='tenyleges' 
      name='Feladatlista' 
      rank={1} 
      id="root"
      status='letezo'
      timeValue={6} 
      timeType='hónap'
    />
    }
    else if(this.state.display === 'idovonal'){
      return <Idovonal tasks={this.props.tasks} />
    }
    else if(this.state.display === 'naptar'){
      return <Naptar tasks={this.props.tasks}/>
    }
  }
  ora = (e) => {
    this.setState({
      óra: e.target.value
    })
  }
  perc = (e) => {
    this.setState({
      perc: e.target.value
    })
  }
  eventPanel = () => {
    return <div className='eventLogger'>
      <input 
        type='number' 
        value={this.state.ideiglenesIdoert} 
        name='timeValueek'
        step='1'
        min='8'
        max='22'
        onChange={this.ora}
        style={{width: '40px'}}
      /> 
      <input 
        type='number' 
        value={this.state.ideiglenesIdoert} 
        name='timeValueek'
        step='10'
        min='0'
        max='60'
        onChange={this.perc}
        style={{width: '40px'}}
      /> 
      <p>{this.props.query.name}</p>
      {this.props.query.status === 'várakozik' && 
        <div 
          className='eventLogButton'
          onClick={this.eventStart}
        >
          Kezdés!
        </div>
      }
      {this.props.query.status === 'folyamatban' && 
        <React.Fragment>
          <div 
            className='eventLogButton'
            onClick={this.breakStart}
          >
            Szünet
          </div>
          <div 
            className='eventLogButton'
            onClick={this.eventComplete}
          >
            Vége
          </div>
        </React.Fragment>
      }
      {this.props.query.status === 'break' && 
        <div 
          className='eventLogButton'
          onClick={this.eventComplete}
        >
          Vége
        </div>
      }
      </div>
    }
    eventStart = () => {
      const {taskId, id, lastEventBot} = this.props.query;
      const {tasks, time} = this.props;
      const tasksWithoutStart = [];
      
      if(taskId){
        let currentTask = tasks.find(task => task.id === taskId);
        
        while (currentTask.type !== "kategoria" && !currentTask.start){
          tasksWithoutStart.push(currentTask.id);
          currentTask = tasks.find(task => task.id === currentTask.pId);
        };
      }
      console.log(tasksWithoutStart)
      this.props.eventStarted(
        id, 
        today+"", 
        time, 
        this.pxToTime(lastEventBot),
        tasksWithoutStart
      )
    }
    eventComplete = (e) => {
      const {taskId, id} = this.props.query;
      const {tasks, time} = this.props;
      if(this.props.query.status === "break"){
        this.props.breakCompleted(id, time)
      } else {
        const tasksWithoutEnd = [];

        if(taskId){
          tasksWithoutEnd.push(taskId)

          const currentTask = tasks.find(task => task.id === taskId);
          let parent = tasks.find(task => task.id === currentTask.pId);
          let childs = tasks.filter(task => task.pId === parent.id && task.id !== currentTask.id);
          //át kell variálni, hogy azt ellenőrizze, hogy az összes child idje benne van-e a taskswithoutendben vagy alapból van e már endje
          while(childs.every(task => task.end || tasksWithoutEnd.some(taskId => taskId === task.id))){
            tasksWithoutEnd.push(parent.id);
            parent = tasks.find(task => task.id === parent.pId);
            childs = tasks.filter(task => task.pId === parent.id)
          }
        }
        this.props.eventCompleted(id, today+"", time, tasksWithoutEnd)
      }
    }
    breakStart = () => {
      this.props.breakStarted("Szünet", today+"", this.props.time)
  }
  render() {
    return (
        <DragDropContext onDragEnd={this.onDragEnd}>

          <div className='nav'>
            <img src={logo} alt='logo'/>
            <div onClick={() => this.menuChange('feladatlista')} className='content' >
              <p>Feladatlista</p>
            </div>
            <div onClick={() => this.menuChange('idovonal')} className='content' >
              <p>Idővonal</p>
            </div>
            <div onClick={() => this.menuChange('naptar')} className='content' >
              <p>Naptár</p>
            </div>
          </div>
          <Takaro/>
          <div className='main'>
            {this.menurender()}
          </div>
          {(this.props.query && this.state.display !== 'feladatlista') && 
            this.eventPanel()}
        </DragDropContext>

    );
  }
}
const mapDispatchToProps = {
  setTime,
  wDim,
  getEventsOfWeek, 
  getTasks,  
  changeRanks, 
  eventStarted, 
  eventCompleted,
  breakStarted, 
  breakCompleted, 
}
function mapStateToProps(state) {
  return {
      tasks: state.tasks,
      query: state.query,
      timeUnit: state.dim.timeUnit,
      dayStart: state.userData.dayStart,
      time: state.time
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(App);
