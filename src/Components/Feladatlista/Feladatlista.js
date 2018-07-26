import React from 'react';
import './Feladatlista.css';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import {connect} from 'react-redux';
import {deleteTask, changeRanks, newTask, taskNameEdit, taskTimeEdit, taskChangingParent, taskChangeParent, coverOn, coverOff} from '../../Firebase'

const newFl = {
    name: '',
    type: '',
    status: ''
}

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: 'none',
  paddingTop: '10px',
  justifyContent: 'center',
  position: 'relative',
  ...draggableStyle,
});

const getListStyle = isDraggingOver => ({
  display: 'flex',
  paddingTop: '10px',
  overflow: 'auto',
  flex: 1
});
class Feladatlista extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            opacity: 0,
            add: 'none',
            initialName: "",
            initialTimeValue: this.props.timeValue || 0,
            possibleTimeTypes: [],
            initialTimeType: '',
            parentTimeValue: 0,
            maxTimeValue: 0,
            nameEdit: false,
            timeEdit: false,
            possibleTask: Object.assign({}, newFl),
            cover: 'none',
            zindex: 0,
            createTask: 'none',
            moveDisplay: 'flex'
        }
    }

    tasks = () => {
        console.log("tasks")
        const wrongRanked = []
        const tasks = this.props.tasks
        .filter(task => task.pId === this.props.id)
        .sort((a, b) => a.rank - b.rank)
        .map((task, i) => {
            const rank = () => {
                if(task.rank !== i + 1){
                    wrongRanked.push({
                        id: task.id,
                        rank: i + 1
                    })
                    return i + 1
                }
                return task.rank
            }
            return <Feladatlista 
                key={task.id}
                type={task.type} 
                name={task.name} 
                rank={rank()} 
                id={task.id} 
                pId={task.pId}
                timeValue={task.timeValue}
                timeType={task.timeType}
                status={task.status}
                tasks={this.props.tasks}
                move={this.props.move}
                moveWhich={this.props.moveWhich}
                deleteTask={this.props.deleteTask}
                newTask={this.props.newTask}
                taskNameEdit={this.props.taskNameEdit}
                taskTimeEdit={this.props.taskTimeEdit}
                taskChangeParent={this.props.taskChangeParent}
                taskChangingParent={this.props.taskChangingParent}
                coverOn={this.props.coverOn}
                coverOff={this.props.coverOff}
            />
        })
        if(wrongRanked.length){
            changeRanks(wrongRanked);
        }
        return tasks
    }
    mouseEnter = () => {
        !this.props.move && this.setState({opacity: 1})
    }
    mouseLeave = () => {
        this.setState({opacity: 0})
    }

    removeElem = (e) => {
        const deletable = [this.props.id];
        for(let i = 0; i < deletable.length; i++){
            this.props.tasks.forEach(task => {
                if(task.pId === deletable[i]){
                    deletable.push(task.id)
                }
            })
        }
        deleteTask(deletable)
    }
    addElem = () => {
        this.props.coverOn();
        this.setState({
            add: 'flex',
            zindex: 2
        })
    }
    close = () => {
        this.props.coverOff();
        this.setState({
            add: 'none',
            zindex: 0
        })
    }
    newElemType = (type) =>{
        this.setState({   
                createTask: 'block',
                zindex: 2,
                add: 'none',
                possibleTask: {
                    ...this.state.possibleTask,
                        type,
                        status: 'letezo'
                }
            }
        )
    }
    newElemName = (event) => {
        this.setState(Object.assign(this.state.possibleTask, {name: event.target.value}))
    }
    
    completeNewElem = () => {
        if(Boolean(this.state.possibleTask.name)){
            const {name, type} = this.state.possibleTask;
            this.props.newTask(name, type, this.props.id);
            this.props.coverOff(); 
            this.setState({
                createTask: 'none',
                zindex: 0,
                possibleTask: {
                    ...this.state.possibleTask,
                    ...newFl
                }
            })
        }
    }
    cancelCreateElem = () => {
        this.props.coverOff();
        this.setState({
            createTask: 'none',
            zindex: 0,
        });
    }
    turnOnNameEdit = () => {
        if(!this.props.move){
            this.props.coverOn();
            this.setState({
                nameEdit: true,
                zindex: 2,
                initialName: this.props.name
            })
        }
    }
    nameEditing = (event) => {
        this.setState({initialName: event.target.value});
    }
    timeValueEditing = (event) => {
        this.setState({initialTimeValue: event.target.value})
    }
    timeTypeEditing = (event) => {
        if(this.props.type === 'tenyleges'){
            if(event.target.value === this.state.possibleTimeTypes[0]){
                this.setState({maxTimeValue: this.state.parentTimeValue})
            }
            else{
                if(event.target.value === 'hónap'){
                    this.setState({maxTimeValue: 6})
                }
                else if(event.target.value === 'hét'){
                    this.setState({maxTimeValue: 4})
                }
                else if(event.target.value === 'nap'){
                    this.setState({maxTimeValue: 7})
                }
                else if(event.target.value === 'óra'){
                    this.setState({maxTimeValue: 12})
                }
            }
        }
        this.setState({initialTimeType: event.target.value})
    }
    completeNameEdit = () => {
        if(Boolean(this.state.initialName)) {
            taskNameEdit(this.props.id, this.state.initialName)
            this.props.coverOff();
            this.setState({
                nameEdit: false,
                zindex: 0,
            });
        }
    }
    cancelNameEdit = () => {
        this.props.coverOff();
        this.setState({
            nameEdit: false,
            zindex: 0,
            initialName: this.props.name || ''
        })
    }
    turnOnTimeEdit = () => {
        const parent = this.props.tasks.find(parent => this.props.pId === parent.id)
        if(!this.props.move && (Boolean(parent.timeValue) || parent.type === 'kategoria')){
            this.props.coverOn();
            this.setState({
                timeEdit: true,
                parentTimeValue: parent.timeValue || 6,
                initialTimeType: 'empty',
                zindex: 2
            })
            if(this.props.type === 'folyamatos'){
                this.setState({possibleTimeTypes: [
                    'hónap',
                    'hét',
                    'nap'
                ]})
            }
            else if(parent.timeType === 'hónap' || !parent.timeType){
                this.setState({possibleTimeTypes: [
                    'hónap',
                    'hét',
                    'nap',
                    'óra'
                ]})
            }
            else if(parent.timeType === 'hét'){
                this.setState({possibleTimeTypes: [
                    'hét',
                    'nap',
                    'óra'
                ]})
            }
            else if(parent.timeType === 'nap'){
                this.setState({possibleTimeTypes: [
                    'nap',
                    'óra'
                ]})
            }
            else if(parent.timeType === 'óra'){
                this.setState({possibleTimeTypes: [
                    'óra'
                ]})
            }
        }
    }
    completeTimeEdit = () => {
        if(Boolean(this.state.initialTimeValue) && this.state.initialTimeType !== 'empty'){
            const timeValue = this.state.initialTimeValue;
            const timeType = this.state.initialTimeType;
            taskTimeEdit(this.props.id, timeValue, timeType);
            this.props.coverOff();
            this.setState({
                timeEdit: false,
                zindex: 0,
            });
        }
    }
    cancelTimeEdit = () => {
        this.props.coverOff();
        this.setState({
            timeEdit: false,
            zindex: 0,
        })
    }
    whereToMove = () => {
          this.props.taskChangeParent(this.props.moveWhich, this.props.id)
    }
    moveWhich = () => {
        !this.props.move && this.props.taskChangingParent(this.props.id)
    }
    
    render(){
        return(
            <div className={"taskWrapper"}
                style={this.props.id === this.props.moveWhich ? 
                    {display: 'none'} : {display: 'block'}
                }
            >
                <Draggable 
                    draggableId={this.props.id} 
                    index={this.props.rank - 1} 
                    type={this.props.pId} 
                    key={this.props.id} 
                    isDragDisabled={this.props.status === "completed" ? true : false}
                >
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                            )}
                        >
                                <div 
                                onClick={this.props.move ? () => this.whereToMove() : undefined}
                                className={this.props.type + ' tlTask'} 
                                onMouseEnter={this.mouseEnter} 
                                onMouseLeave={this.mouseLeave}
                                style={{
                                    backgroundColor: `rgba(42, ${255 - (55 / this.props.rank) }, 139, 0.76)`,
                                    width: `${140 + (30 / this.props.rank)}px`,
                                    height: `${80 + (18 / this.props.rank)}px`,
                                    zIndex: this.state.zindex
                                }}
                                >
                                {this.state.nameEdit ?
                                    <React.Fragment>
                                        <input className='taskName input'
                                            type='text' 
                                            value={this.state.initialName} 
                                            name='name' 
                                            onChange={this.nameEditing}
                                            autoFocus
                                        /> 
                                        <div className='tlButtonsWrapper'>
                                        <div
                                            className='create tlButton'
                                            onClick={this.completeNameEdit}>
                                            ok
                                        </div>
                                        <div
                                            className='cancel tlButton'
                                            onClick={this.cancelNameEdit}>
                                            mégse
                                        </div>
                                        </div>
                                    </React.Fragment>
                                :
                                    <p className = 'taskName' onClick={this.turnOnNameEdit}>          {this.props.name}
                                    </p>
                                }
                                <p className = 'rank' >{this.props.rank}</p>
                                {this.state.timeEdit ?
                                    <React.Fragment>
                                    <div className = 'tlTime'>
                                        <input 
                                            type='number' 
                                            value={this.state.initialTimeValue} 
                                            name='timeValue'
                                            step='.5'
                                            min='1'
                                            max={this.state.maxTimeValue}
                                            onChange={this.timeValueEditing}
                                            style={{width: '40px'}}
                                        /> 
                                        {this.props.type === 'folyamatos' && <p>óra /</p>}
                                        <select onChange={this.timeTypeEditing}>
                                            <option value='empty'>-</option>
                                            {this.state.possibleTimeTypes.map(type => 
                                                <option value={type}>{type}</option>
                                            )}
                                        </select>
                                        </div>
                                        <div className='tlButtonsWrapper'>
                                        <div
                                            className='create tlButton'
                                            onClick={this.completeTimeEdit}>
                                            ok
                                        </div>
                                        <div
                                            className='cancel tlButton'
                                            onClick={this.cancelTimeEdit}>
                                            mégse
                                        </div>
                                        </div>
                                    </React.Fragment>
                                :
                                this.props.type !== 'kategoria' &&
                                    (this.props.timeValue ? 
                                        <div className = 'tlTime' onClick={this.turnOnTimeEdit}>
                                            <p style = {{marginRight: '5px'}}>{this.props.timeValue}</p>
                                            {this.props.type === 'folyamatos' &&
                                                <p>óra /</p>
                                            }
                                            <p>{this.props.timeType}</p>
                                        </div>
                                        :
                                        <div className = 'tlTime' onClick={this.turnOnTimeEdit}>
                                            <p>Idő beállítása</p>  
                                        </div>                                      
                                    )
                                }
                                <div className='tlButtonsWrapper'
                                    style={this.state.zindex === 2 ? {display: 'none'} : {}}
                                >
                                    <div 
                                        style={{opacity: this.state.opacity}} 
                                        className='tlButton' 
                                        onClick={this.addElem}>
                                        +
                                    </div>
                                    <div 
                                        style={{opacity: this.state.opacity}} 
                                        className='tlButton' 
                                        onClick={this.moveWhich}>
                                        -
                                    </div>
                                    <div 
                                        style={{opacity: this.state.opacity}} 
                                        className='tlButton' 
                                        onClick={this.removeElem} >
                                        -
                                    </div>
                                </div>
                                </div>
                                


                <div className='taskTypes' style={{display: this.state.add, zIndex: '1'}} >
                    <div className='tenyleges tlTask initial' onClick={() => this.newElemType('tenyleges')}>
                        <p>Tényleges</p>
                    </div>
                    <div className='folyamatos tlTask initial' onClick={() => this.newElemType('folyamatos')}>
                        <p>Folyamatos</p>
                    </div>
                    <div className='hianyos tlTask initial' onClick={() => this.newElemType('hianyos')}>
                        <p>Hiányos</p>
                    </div>
                    <div className='kategoria tlTask initial' onClick={() => this.newElemType('kategoria')}>
                        <p>Kategória</p>
                    </div>
                    <div 
                        className='tlButton' 
                        onClick={this.close} 
                        style = {{height: '20px'}}
                    >
                        Mégse
                    </div>
                </div>
                <div style = {{display: this.state.moveDisplay}}>

                    <Droppable droppableId={this.props.id} type={this.props.id}  direction="horizontal">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                style={getListStyle(snapshot.isDraggingOver)}
                                {...provided.droppableProps}
                            >
                                <div className='letezo' style={{display: this.state.createTask, zIndex: 2}} >
                                    <div className={this.state.possibleTask.type + ' tlTask initial'}>
                                        <input className='input newTaskName' type='text' placeholder='Feladat neve' value={this.state.possibleTask.name} onChange={this.newElemName} autoFocus />
                                        <div className='tlButtonsWrapper'>
                                            <div className='tlButton' onClick={this.completeNewElem}>Ok</div>
                                            <div className='tlButton' onClick={this.cancelCreateFl}>Mégse</div>
                                        </div>
                                    </div>
                                </div>
                                {this.tasks()}
                            </div>
                        )}
                    </Droppable>
                </div>
                </div>
            )}
        </Draggable>

            </div>
        )
    }
}
const mapStateToProps = (state, ownprops) => ({
    ...ownprops, 
    tasks: state.tasks, 
    move: state.move,
    moveWhich: state.moveWhich
})
const mapDispatchToProps = {
    deleteTask, 
    changeRanks, 
    newTask, 
    taskNameEdit, 
    taskTimeEdit, 
    taskChangeParent,
    taskChangingParent,
    coverOn,
    coverOff
}
  
export default connect(mapStateToProps, mapDispatchToProps)(Feladatlista);