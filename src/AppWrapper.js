import React from 'react';
import App from './App';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import fetch from 'cross-fetch';
import { composeWithDevTools } from 'redux-devtools-extension';
import { todayOfWeek } from './Ido';
//a topot és botot az hours 12szorosára növeljük. az időegységet pedig 4szeresére

const initialState = {
  tasks: [],
  events: [[],[],[],[],[],[],[]],
  contiEvents: [[],[],[],[],[],[],[]],
  breaks: [],
  cover: 'none',
  move: false,
  moveWhich: 0,
  time: 0,
  dim: {
    navH: 80,
    calHeaderH: 80,
    //időegység = 15 perc
    timeUnit: 10,
    calDayW: 200,
    timesW: 100,
    wW: 1500
  },
  userData: {
    //12es szorzó (5 perc), és ez a szorzó fix.
    dayStart: 96,
    dayEnd: 288,
  },
  query: {}
}
const reducer = (state = initialState, action) => {
  const timeToPx = (time) => {
    return (time - state.userData.dayStart) * state.dim.timeUnit / 3
  }
  switch (action.type) {
    case 'WINDOW_DIMENSIONS' :
      return{
        ...state,
        dim: {...action.display, wW: action.wW}
      }
    case 'SET_TIME' :
      return{
        ...state,
        timePx: timeToPx(action.time),
        time: action.time,
      }
    case 'GET_TASKS':
      return{
        ...state,
        tasks: action.tasks
      }
    case 'NEW_TASK' : 
      return{
        ...state,
        tasks: [
          ...state.tasks,
          action.task
        ]
      }
    case 'DELETE_TASK' : 
      return{
        ...state,
        tasks: state.tasks.map(task => {
          if(task.id === action.id){
            return{
              ...task,
              status: 'torolt'
            }
          } else {
            return task
          }
        })
      }
    case 'CHANGE_RANK':
      const tasks = state.tasks.map((task) => {
        if(task.id === action.id){
          return {
            ...task,
            rank: action.rank
          }
        } else {
          return task
        }
      })
      return{
        ...state,
        tasks
      }
    case 'COVER_ON' : 
    return{
      ...state,
      cover: 'block'
    }
    case 'COVER_OFF' :
    return{
      ...state,
      cover: 'none'
    }
    case 'MOVE_TASK_START' :
      return{
        ...state,
        move: true,
        moveWhich: action.moveWhich
      }
    case 'MOVE_TASK_COMPLETE' :
    return{
      ...state,
      move: false,
      moveWhich: undefined
    }
    case 'GET_CONTINUOUS_EVENTS' :
      //három lehetőség van. vagy van az eventnek rbot és rtop, akkor azzal helyezzük el, ha nincs, és múltbéli nap, akkor pihenőnap, ha jövőbeli, akkor simán alaphelyzet
      let contiEventsWeek = [];
      action.days.forEach(day => {
        let contiEventsDay = [];
        day.forEach(event => {
            if(event.type === "dayStarter"){
              const height = timeToPx(event.height + state.userData.dayStart),
                top = timeToPx(state.userData.dayStart),
                bot = timeToPx(state.userData.dayStart) + height,
                rTop = event.rTop ? timeToPx(event.rTop) : null,
                rBot = event.rBot ? timeToPx(event.rBot) : null,
                name = "Day start",
                rHeight = rTop && rBot ? rBot - rTop : null;

              contiEventsDay.push({
                ...event,
                height,
                name,
                rTop,
                rBot,
                top,
                bot,
                rHeight
              })
            }
        })
        contiEventsDay.sort((a, b) => a.top - b.top);
        contiEventsWeek.push(contiEventsDay);
      })
        return{
          ...state,
          contiEvents: contiEventsWeek,
        }
    case 'GET_TASK_EVENTS' : 
      const taskEvents = {};

      state.tasks
      .filter(taskEvent => taskEvent.timeType === "hours" && !taskEvent.inCal)
      .map(taskEvent => {
          const task = {
              id: taskEvent.id,
              name: taskEvent.name,
              length: taskEvent.timeValue,
              rankings: []
          };
          
          let currentTask = taskEvent;
          if(state.tasks.find(task => task.id === taskEvent.pId).type !== 'category'){
              for(let i = 0;; i++){
                  task.rankings[i] = currentTask.rank;
                  const parent = state.tasks.find(task => task.id === currentTask.pId);
                  if(parent.type === 'category'){break};
                  currentTask = parent;
              } ;
          } else {task.rankings[0] = currentTask.rank}
          task.rankings.reverse()
          
          if(taskEvents[currentTask.name]){
              taskEvents[currentTask.name].push(task)
          } else {taskEvents[currentTask.name] = [task]}
      })
      Object.keys(taskEvents).forEach(group => {
          taskEvents[group].sort(({ rankings: a }, { rankings: b }) => {
              var d;
              a.some((v, i) => d = v - b[i]);
              return d;
          }).reverse();
      })
      return{
        ...state,
        taskEvents
      }
    case 'REMOVE_FL_EVENT' : 
      const newTaskEvents = {}
      Object.keys(state.taskEvents).forEach(group => {
        newTaskEvents[group] = state.taskEvents[group].filter(fe => fe.id !== action.id)
      })
      return{
        ...state,
        taskEvents: newTaskEvents,
        tasks: state.tasks.map(task => {
          if(task.id === action.id){
            return{
              ...task,
              inCal: true
            }
          } else {
            return task
          }
        })
      }
    case 'REMOVE_EVENT' : 
      return {
        ...state,
        events: state.events.map((day, i) => {
          if(i === action.index){
            return day.filter(e => e.id !== action.id)
          } else {
            return day
          }
        })
      }
    case 'EDIT_EVENT' :
      return {
        ...state,
        events: state.events.map((day, i) => {
          if(i === action.index){
            return day.map(e => {
              if(e.id === action.id){
                return {
                  ...e,
                  top: action.top,
                  bot: action.bot
                }
              } else {
                return e
              }
            }).sort((a, b) => a.top - b.top)
          } else {
            return day.sort((a, b) => a.top - b.top)
          }
        })
      }
    case 'REPLACE_FL_EVENT' : 
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if(task.id === action.taskId){
            return {
              ...task,
              inCal: false
            }
          } else {return task}
        })
      }
    case 'GET_EVENTS' :
    console.log(action.days)
    let eventsWeek = [], breaksWeek = [];
    action.days.forEach(day => {
      let eventsDay = [], breaksDay = [];
      day.forEach(event => {
        if(event.type === "event"){
          eventsDay.push({
            id: event.id,
            taskId: event.taskId,
            name: event.name,
            top: timeToPx(event.top),
            bot: timeToPx(event.bot),
            rTop: event.rTop && timeToPx(event.rTop),
            rBot: event.rBot && timeToPx(event.rBot),
          })
        } else if(event.type === "break"){
          breaksDay.push({
            id: event.id,
            name: event.name,
            top: timeToPx(event.top),
            bot: event.bot ? timeToPx(event.bot) : null,
          })
        }
      })
      eventsDay.sort((a, b) => a.top - b.top);
      eventsWeek.push(eventsDay);
      breaksWeek.push(breaksDay)
    })
      return{
        ...state,
        events: eventsWeek,
        breaks: breaksWeek
      }
    case 'NEW_EVENT' :
      return{
        ...state,
        events: state.events.map((day, i) => {
          if(i === action.index){
            return [
              ...day,
              action.event
            ].sort((a, b) => a.top - b.top)
          } else {
            return day.sort((a, b) => a.top - b.top)
          }
        })
      }
    case 'BREAK_STARTED' : 
      return{
        ...state,
        query: {
          id: action.id,
          name: action.name,
          status: "break"
        },
        breaks: state.breaks.map((day, i) => {
          if(i === todayOfWeek){
            return [
              ...day,
              {
                id: action.id,
                name: action.name,
                top: timeToPx(action.top)
              }
            ]
          } else {
            return day
          }
        })
      }
    case 'GET_EVENT_QUERY' :
      const events = [...state.events[todayOfWeek], ...state.contiEvents[todayOfWeek]].sort((a, b) => a.rTop || a.top - b.rTop || b.top);
      const breaks = state.breaks[todayOfWeek];
      let query = {};
      console.log(events)
      for(let i = 0; i < breaks.length; i++){
        if(!breaks[i].bot){
          query = {
            id: breaks[i].id,
            name: breaks[i].name,
            status: "break"
          }
          break
        }
      }
      if(!Object.keys(query).length){
        for(let i = 0; i < events.length; i++){
          if(events[i].rTop && !events[i].rBot){
            query = {
              id: events[i].id,
              name: events[i].name,
              taskId: events[i].taskId || null,
              status: "folyamatban",
              lastEventBot: undefined,
              type: events[i].type
            }
            break
          }
        }
      }
      if(!Object.keys(query).length){
        const lastEventBot = Math.max(...events.filter(e => !isNaN(e.rBot)).map(e => e.rBot));
        console.log(events.filter(e => !isNaN(e.rBot)).map(e => e.rBot), lastEventBot)
        query = {lastEventBot: Boolean(lastEventBot) ? lastEventBot : 1}
        for(let i = 0; i < events.length; i++){
          if(!events[i].rTop && !events[i].rBot){
            query = {
              ...query,
              id: events[i].id,
              name: events[i].name,
              taskId: events[i].taskId || null,
              status: "várakozik",
              type: events[i].type
            }
            break
          }
        }
      }
      return{
        ...state,
        query
      }
    case 'EVENT_STARTED' :
      return {
        ...state,
        breaks: !state.query.lastEventBot ? state.breaks :
          state.breaks.map((day, i) => {
            if(i === todayOfWeek){
              return [
                ...day, {
                  name: "Break",
                  top: state.query.lastEventBot,
                  bot: timeToPx(action.rTop)
                }
              ]
            } else {
              return day
            }
          }),
        query: {
          ...state.query,
          status: 'folyamatban',
          lastEventBot: null
        },
        events: state.events.map((day, i) => {
          if(i === todayOfWeek){
            return day.map(e => {
              if(e.id === state.query.id){
                return {
                  ...e,
                  rTop: timeToPx(action.rTop)
                }
              } else {
                return e
              }
            })
          } else {
            return day
          }
        }),
      }
    case 'EVENT_COMPLETED' :
      return {
        ...state,
        events: state.events.map((day, i) => {
          if(i === todayOfWeek){
            return day.map(e => {
              if(e.id === state.query.id){
                return {
                  ...e,
                  rBot: timeToPx(action.rBot)
                }
              } else {
                return e
              }
            })
          } else {
            return day
          }
        })
      }
    case 'BREAK_COMPLETED' : 
      return {
        ...state,
        breaks: state.breaks.map((day, i) => {
          if(i === todayOfWeek){
            return day.map(e => {
              if(e.id === state.query.id){
                return {
                  ...e,
                  bot: timeToPx(action.bot)
                }
              } else {
                return e
              }
            })
          } else {
            return day
          }
        })
      }
    default:
      return state
  }
};
//órás task ellenőrzi a szüleit (valószínűleg az idővonalban, mert ott van módszer a szülő gyerek kapcsolat legrészletesebben), oly módon, hogy: addig megy fel a fán, amíg talál az elem olyan szülőt, amelynek nincs valós kezdete (lnkflig). Ha pedig egy task dayEnd van, ellenőrzi a szülejét hogy minden gyerekének van e dayEnd. Ha igen, akkor beállítja a szülő végét a legutolsó elem végének. Tehát ha egy elem kap véget, ellenőrzi hogy a szüleje összes gyerekének van e dayEnd. Mindegy hogy milyen szinten van az elem. Ha pedig egy elem kap véget, akkor az állapota "kész"-re változik.
//kezdés
/*if(event.taskId){
  const kezdésNélküliFlek = [];
  let currentTask = tasks.find(task => task.id === event.taskId);
  while (currentTask.type !== "category" && !currentTask.kezdet){
    kezdésNélküliFlek.push(currentTask.id);
    currentTask = tasks.find(task => task.id === currentTask.pId);
  };
}
//befejezés
if(event.taskId){
  const végNélküliFlek = [];
  const currentTask = tasks.find(task => task.id === event.taskId);
  let parent = tasks.find(task => task.id === currentTask.pId);
  let gyerekek = tasks.filter(task => task.pId === parent.id);
  while(gyerekek.every(task => task.vég)){
    végNélküliFlek.push(parent.id);
    parent = tasks.find(task => task.id === parent.pId);
    gyerekek = tasks.filter(task => task.pId === parent.id)
  }
  //végnélküli idk megkeresése, végük/kezdetük beállítása action.kezdet/végre + konvertálás (bár mivel mindegyik dayban mérhető, emiatt valójában nem kell, csak a dátumot dayévvel)
}*/

const store = createStore(reducer, composeWithDevTools(
  applyMiddleware(thunk)
));

const AppWrapper = () => {
    return (
        <Provider store={store}>
            <App/>
        </Provider>
    )
};
export default AppWrapper;