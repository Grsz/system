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
import {setTime, wDim, getEventsOfWeek, getTasks, changeRanks, eventStarted, breakStarted, breakCompleted, eventCompleted, getContiEvents, checkDays, contiEventCompleted} from './Firebase';

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
      display: 'feladatlista'
    }
    this.onDragEnd = this.onDragEnd.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }
  counter;

//user dashboard
//belépés, kezdetek, bevezetés, kezdés, zárás
//nap, hét, hónap zárás, nyitás
//statisztikák (előző egységhez képest) - (pontosság, teljesítmény, szünetek, százalékos arány szülőkhöz képest egységenként - aktuális feladatcsoport aktuális nézetéhez viszonyítva)
//belépéskor, nap elején az első belépés a napnyitás. a belépéstől és a végétől számítva csinálja a naptár a napnyitás időpontját. a belépés előtti időszak szünet (ha felkelés előtt van - és méri a túlalvást)
//az ideális végzés időpontjában kérdés - kész van e. ha van cselekmény, folytatja tovább. fél óra múlva újabb értesítés, ha nincs ekkor se cselekmény fél óra után, akkor a feladat befejezetlennek, félbeszakítottnak minősül, és elkönyveli a nap zárásának
//ha egy nap utolsó feladata van, akkor ugyanúgy, auto elhelyezett feladatokról kérdez a statusbar
//auto elhelyezett feladatok (zárás, nyitás, olvasás, tanulás, evés - bár ezek lehetnének folyamatos feladatok mondjuk, egy auto elhelyezett kategóriában, pl neve létszükséglet, és ez egy különleges, auto generált kategória lenne ami nem jelenik meg az idővonalon. Nem törölhető ki, és kötelező őket elhelyezni (talán), és ugyanúgy be kell állítani, hogy mennyi időt vesz majd igénybe)
//nyitás-check: belépéskor, amikor a közopnt (app) érzékeli, hogy beléptek, ellenőrzi, hogy meg lett-e már csinálva aznap a napzárás (azaz a naplóban benne van-e az adott napi cél elkészítve) - ehhez lehetne csinálni egy tanácsot mondjuk, vagy automatikusan a feladatlistához vezetne, vagy pedig egyszerűen csak a naptárban kellene beilleszteni az elemeket (talán az utolsó) - első belépéskor ugyanúgy kérdezi, hogy: napnyitás elkezdve? ha az user megcsinálta, akkor pedig befejezve, és minden megy tovább.
//tanácsok - statisztika alapján
//kezdőoldal
//emlékeztetők

//kezdet, vég
//kezdéskor ellenőriznie kéne az appnak az időt, és a feladatokat. kéne egy state reduxba, ami csak egy switch 
//az appba ha belépnek, az tudni fogja: a napot, az órát, és az adott napi feladatokat.
//ha a napkezdés egy auto feladat lesz, akkor a startolás meg fogja tudni határozni az alvás overt.
//tehát ha a feladat a napkezdés, akkor az app ellenőrzi, hogy mikor kezdődött el. kivonja a kezdőidőből, és megvan a szünet. csinál is neki egy eventet.
//példaként, ha több napon át nem lett használva az app, akkor a hét visszaellenőrzésnél megnézi, a npokat visszafelé egymást követve, hogy hol nem lett elkezdve a napkezdés (mivel annak mindig elsőnek kell lennie. ha a napkezdés nem lett elkezdve, akkor biztos hogy a nap sem lett.)
//ha egy nap félbe lett hagyva, akkor az értesítések után követendő példa lesz. ha viszont unable értesítés küldéshez, akkor - talán ellenőrzi a az app az összes órás feladatot, ahol csak kezdés van nem aznap. az adott nap utána következő szakát pedig szünetnek ítéli.
//statisztikák
//eventekbe új prop, folyamatos, állandó -> napkezdés
//napkezdés event
//napló - kategóriák ? napkezdések...
/*
a tervezett kezdések, valós kezdések közötti különbség, ?
//a kezdések közötti künönbségek azért nem relevánsak, mert ha pl 2 órával később kezdte valaaki a munkát, akkor az összes feladat a tervezett hosszal számolva is mindegyiket 2 óra csúszásnak ítélné
//ezért inkább legyen releváns a szünetek idejének megszámlálása
//valahogy meg kell oldani, hogy már a kezdettől szünetet számítson
tervezett hossz, valós hossz közötti különbség
napló = {
  napkezdések = {
    2017.04.12 = {

    }
  }
}
*/
//a napkezdés, szünet probléma megoldva. tehát a belépés, és az első elkezdett feladattól függően megtudja az app, hogy a tervezett kezdéstől számítva mennyi szünet lett felszámolva. (bár itt lehet majd probléma azzal, ha valaki korábban kezdett ,mert azt az app minusznak fogja számlálni)
//a következő probléma a félbehagyott nap. bár itt gond a desktop az értesítések miatt. itt két lehetőség van. az egyik, ha nincs belépve, a másik ha be van lépve. kellene egy kezdő napellenőrzést csinálni. ehhez valószínűleg kell majd a napkezdő. ugyanis az meg tudja mondani, hogy el lett e kezdve a nap vagy sem. ha aznap nem lett még elkezdve, akkor ellenőrzi az előző napot. ha az nem lett elkezdve, akkor az lesz az "aktuális nap", és így loopolunk, több kritériumot figyelembe véve. egyáltalán hogy a nap el lett e kezdve. ha nem, akkor az pihenőnap. ha el lett kezdve, akkor is ellenőrzi, hogy aznap volt e olyan feladat, aminek van rtop, de nincs rbot.
//tehát meg kell csinálni valahogy a napkezdőt. 
//két lehetőség van erre. vagy minden napra készítünk egy eventet, vagy pedig készítünk egy külön tárolót, ahol szimplán a folyamatos feladatokat tároljuk, és a naplóból szedjük majd ki őket. 
//folyamatos eventek
//ha egy task folyamatos, az eljárás, hogy ugyanúgy a tasklistből kapja meg a nap, csak minden nap megkapja
//kezdésnél és végzésnél pedig a dátum szerint belekerül a folyamatos feladatok listájába a dbben. ennek 3 propjának kellene lennie, date, top, bot
//itt visznt van egy nagy különbség a foly feladatok és az áll. eventek között. a foly feladatok tetszés szerint illeszthetők be a naptárba, az áll események mindig benne vannak alapból. ezt valahogayn jelezni kell. 
//lehetséges megoldás, ha csinálunk egy külön propot az állandó eseményeknek, ahol az alap dimek lesznek benne. utána pedig külön a dátumok,
//a foly feladaotk pedig a taskgroupsban kapnak helyet, és csupán annyi különbség lesz köztük és a tényleges feladatok között, hogy ezek minden nap ismét belekerülnek a listába, ezeknek pedig az állandó események naplózott listájában csak egy rtopot és egy rbotot kapnak, tehát valójában ugyanúgy lesznek majd kezelve, mit egy rendes event. de mondjuk ezeknek is kapniuk kell majd topot és botot, hogy hol lettek elhelyezve, csak ennél naponként lesz eltérő. ezt még ki kell majd fejleszteni, először az áll eventekkel foglalkozunk.

/*foly fl teendők: 
* szín megcsinálása, 
* groupba rakás calendarba (ha aznap még nincs benne a calendarba, kerüljön a groupba (redux reducer csinálásnál)), 
* ha groupból calendarba lett rakva, ugyanúgy kiveszi a groupból, csak a tervezett topot és bottomot az adott naphoz beteszi a db contiuousba 
* (a nap ellenőrzésnél pedig ahol nem volt benne oda a folyamatos feladatok mindegyikéhez berakja hogy unsuccessful (ezért, hogy ne a teljes kezdődátumig menjen a folyamatos feladatok hozzáadásához kell a készítés dátuma))
* az rtopot rbotot pedig ugyanúgy mint egy rendes feladatnál kell megcsinálni
*/

/**
 * a daystarternél pedig amikor van a napellenőrzés, és ha az aznapi daystarter nincs még elkezdve, akkor az akt idő szerint csináljon neki rtopot, és kezdje el. (és csinálja meg az event queryt is)
 * az adatokat pedig a dbbe az akt naphoz írja be.
 * mindig kezelje eventként őket (kell csinálni egy actiont ha fel lett dolgozva a dbben a tltodayt használva, a múltbélieket belerakni a végeredményük szerint, az aznapit a folyamat szerint, a jövőbelieket pedig a napkezdő toppal, napkezdő + length bottal)
 * pihenőnapok ellenőrzése: új pihenőnap array (csak dátum: true), reduccerben feldolgozás szünetként, név pihenőnap az összesnek, top napkezd bot napzár
 */
/*

//vége eventre való kiegészítése az eventend if daystart

//a felső csinálja meg az eventkészítéseket, az on csak hallgat rájuk
//egyszerűen ha hívjuk a geteventsofweekbe a contieventsrefeket
*/
//tehát az adat struktúra így fog kinézni:
/*
  contiEvents: 
    dayStarter: {
      length: 6,
      2018.07.29.: {
        rTop: 200,
        rBot: 210
      },
      2018. 07. 30.:{
        rTop: 300,
        rbot: 350
      }
    },
    folyamatosEsemény: {

    }
  }
  és valahol fel is kell dolgozni ezeket.
  bele kellene rakni egyszerűen redux storeba eventként
*/


  pxToTime = (px) => {
      return Math.round(px / this.props.timeUnit * 3) + this.props.dayStart;
  }

  timeToPx = (time) => {
      return (time - this.props.dayStart) * this.props.timeUnit / 3
  }

  componentWillMount(){
    this.props.getEventsOfWeek();
    this.props.getTasks();
    this.props.getContiEvents();
  }
  
  componentDidMount() {
    checkDays(this.props.dayStart)
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
        max='24'
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
          Start
        </div>
      }
      {this.props.query.status === 'folyamatban' && 
        <React.Fragment>
          <div 
            className='eventLogButton'
            onClick={this.breakStart}
          >
            Break
          </div>
          <div 
            className='eventLogButton'
            onClick={this.eventComplete}
          >
            Finish
          </div>
        </React.Fragment>
      }
      {this.props.query.status === 'break' && 
        <div 
          className='eventLogButton'
          onClick={this.eventComplete}
        >
          Finish
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
        
        while (currentTask.type !== "category" && !currentTask.start){
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
      const {taskId, id, status, type} = this.props.query;
      const {tasks, time} = this.props;
      if(status === "break"){
        this.props.breakCompleted(id, time)
      } else if(type === "dayStarter"){
        contiEventCompleted(id, time, type)
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
      this.props.breakStarted("Break", today+"", this.props.time)
  }
  render() {
    return (
        <DragDropContext onDragEnd={this.onDragEnd}>

          <div className='nav'>
            <img src={logo} alt='logo'/>
            <div onClick={() => this.menuChange('feladatlista')} className='content' >
              <p>Tasklist</p>
            </div>
            <div onClick={() => this.menuChange('idovonal')} className='content' >
              <p>Timeline</p>
            </div>
            <div onClick={() => this.menuChange('naptar')} className='content' >
              <p>Calendar</p>
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
  getContiEvents
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
