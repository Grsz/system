import firebase from 'firebase';
import {datesOfWeek, compareDates, todayString, today, dateToYMD, dayOfYearToDate, todayOfYear, startDayOfYear} from './Ido.js';

var config = {
    apiKey: "AIzaSyDzt-Vp8gKlycA5whJIGkWpqU-UNqPpL-0",
    authDomain: "syst-1c7e7.firebaseapp.com",
    databaseURL: "https://syst-1c7e7.firebaseio.com",
    projectId: "syst-1c7e7",
    storageBucket: "syst-1c7e7.appspot.com",
    messagingSenderId: "769680017725"
  };
firebase.initializeApp(config);

var firebaseRef = firebase.database().ref();
var tasksRef = firebaseRef.child('tasks');
var eventsRef = firebaseRef.child('events');
var contiEventsRef = firebaseRef.child('contiEvents');
console.log(contiEventsRef)
//a contitasks feldolgozásánál ellőnirizni kell majd, hogy az adott napon benne van e már a listában. ha igen, akkor a beillesztésnél egyrészt megy a contieventsbe a top és bot, másrészt törlődik az adott napi taskgroups listából
//meg kell csinálni majd az initialt, ha egy user újként jelentkezik be


export const setTime = (d, h, m) => {
    //const date = new Date();
    //később kitörölni a propot is
    const date = new Date(2018, 6, d, h, m);
    let hour = date.getHours();
    const minute = date.getMinutes();
    const time = Math.round(minute / 5) + (hour * 12);
    return {
      type: 'SET_TIME',
      time
    }
  }
export const wDim = (dims, wW) => {
    return {
        type: 'WINDOW_DIMENSIONS',
        display: dims,
        wW: window.innerWidth
    }
} 
export const getEventQuery = () => {
    return {type: 'GET_EVENT_QUERY'}
}

export const coverOn = () => {return {type: 'COVER_ON'}}
export const coverOff = () => {return {type: 'COVER_OFF'}}

export const getEventsOfWeek = () => async dispatch => {
    eventsRef.on("value", snap => {
        const days = [[],[],[],[],[],[],[]];
        const events = snap.val();
        datesOfWeek.forEach((day, i) => {
            if(events){
                Object.keys(events).forEach(key => {
                    if(compareDates(new Date(events[key].date), day)){
                        days[i].push({
                            ...events[key],
                            id: key
                        })
                    }
                })
            }
        })
        dispatch({
            type: 'GET_EVENTS',
            days
        })
        dispatch(getEventQuery())
    })
}

export const contiEventCompleted = (id, rBot, type) => {
    contiEventsRef.child(type + "/" + id + "/rBot").set(rBot)
}

export const checkDays = (dayStart) => {
    contiEventsRef.child("dayStarter").once("value", snap => {
        const days = snap.val();
        const started = dayOfYear => Object.keys(days).some(day => compareDates(new Date(day), dayOfYearToDate(dayOfYear)));
        let actDay = todayOfYear;
        console.log(started(actDay))

        if(!started(actDay)){
            const date = new Date();
            const hour = date.getHours();
            const minute = date.getMinutes();
            const rTop = Math.round(minute / 5) + (hour * 12);

            const newBreakRef = eventsRef.push();
            newBreakRef.set({
                name: "Break",
                top: dayStart, //később a dbben lesz az useradat
                bot: rTop,
                type: "break",
                date: todayString
            })

            contiEventsRef.child("dayStarter/" + todayString).set({rTop});
            actDay--;


            while(!started(actDay) && actDay !== startDayOfYear){
                contiEventsRef.child("holiday/" + dateToYMD(dayOfYearToDate(actDay))).set(true);
                actDay--;
            }
        }
    })
};
export const getContiEvents = () => async dispatch => {
    contiEventsRef.on("value", snap => {
        const days = [[],[],[],[],[],[],[]];
        const eventsArray = snap.val();

        datesOfWeek.forEach((day, i) => {
            Object.keys(eventsArray).forEach(eventGroup => {

                const dateString = dateToYMD(day);
                const event = eventsArray[eventGroup];

                if(dateString in event){
                    days[i].push({
                        ...event[dateString],
                        type: eventGroup,
                        id: dateToYMD(day),
                        height: event.height
                    })
                }
                if(eventGroup === "dayStarter" && new Date(dateToYMD(day)) > new Date(todayString)){
                    days[i].push({
                        type: eventGroup,
                        id: dateToYMD(day),
                        height: eventsArray[eventGroup].height
                    })
                }
            })
        })
        dispatch({
            type: 'GET_CONTINUOUS_EVENTS',
            days
        })
        dispatch(getEventQuery())
    })
}
//vajon a redux dolga a nap ellenőrzés (van a korábbi)
//kell egy ellenőrző, ahol tudjuk ellenőrizni az előző napok történését. nézzük meg, hol tudjuk ezt megtenni:
//-itt, a firebaseban mindent nem tudunk megtenni, mert csak külön külön férünk hozzá az adatokhoz
//-a reduxszal pedig az a baj, hogy ugyan hozzáfér az adatokhoz, de nem tud akciókat végrehajtani
//-az appban viszont a storehoz is hozzáférünk, viszont csak pár (vagy az sem) nappal vissza.
//tehát a legjobb itt lenne megoldani, és az ellenőrzésre egy külön funkciót is alkalmazhatnánk, de külön a gettől (vagy nem)
//itt kell megcsinálni, több fázisban. geteljük az összes napkezdőt. készítünk két arrayt, az egyiket a pihenőnapoknak (ami csak egy dátumot fog tartalmazni, és készít vagy egy új breakot (eventet) pihenőnap typeval, vagy pedig egy teljesen új db objectet, egy pihenőnapok arrayt), a másikat a napkezdő eventeknek, amik tényleg teljesen úgy fognak viselkedni mint egy event. itt a szerver elvégzi a maga feladatait az adatoktól függően, az arrayokat továbbítja reduxnak, ami pedig azokat elhelyezi az eventsbe, és breaksba. a pihenőnap csak dátumot fog tartalmazni, és csak a kezdődátumig tud menni (a loop)
//tehát most két dologgal foglalkozunk. legyen meg, hogy hol volt napkezdés, és hol nem, illetve hogy hol kell még lennie. itt kétfelé kellene osztani a dolgokat, az egyik foglalkozik azzal, hogy a megfelelő objecteket továbbítsa a wrappernek, a másik pedig hogy ahová szükséges, készítsen objecteket a dbbe.
//a következő időket kell tudni. aktuális hét napjai, mai nap.
//lehet két külön funkciót kellene csinálni
//az egyik, ahol megmegy az ellenőrzés, ott a mai naptól visszafelé számolva történnek majd a dolgok, a napok ellenőrzése, hogy hová kell pihenőnapot, vagy félbehagyott napot tenni. ez történne először, és a fb elkészítené az eventeket
//a másik, ahol továbbítja a reduxnak az adatokat. Lehetne úgy, hogy (mivel a reduxnak csak az adott 7 nap kell) egy 7 darabos array, ahol van rt, rb, oda beteszi (t, b, rt, rb), ahol az array egyetlen eleme past, oda nem teszi be (ugyanis az előző fn csinál egy pihenőnap eventet oda), ahol jövős, ott az array egyetlen eleme future, oda az alap topot, bottomot rakja. Ha az aznapiról van szó, akkor ugyanúgy viselkedik mint egy sima event.
//azt meg lehetne csinálni, hogy ha az aznapi napkezdőnek nincs rtop, akkor legyen (az aktuális idő), és ha nincs, akkor végezze el a checket. tehát: készítünk egy 7es arrayt a reduxnak. azok a datesofweek és az eventek hasonlóságát fogják ellenőrizni, de ha a datesofweek[i] === today, és ha nincs ilyen keyű napkezdő, akkor ellenőrzi az előző napokat, és fut egy másik loop, addig amíg vagy az aktuálisnap már a kezdeti nap, vagy az aktuálisnapnak van daystarterje. ha van, akkor egy utolsó ellenőrzésképp megnézi az app, hogy befejezetlen volt e a nap, aztán vége a loopnak (a belsőnek, de a külső tovább megy, és a gyorsítás érdekében lehetne egy today booleant csinálni, és ha today === true, akkor a loop további elemei már csak a future értéket kapják.)

export const getTasks = () => async dispatch => {
    tasksRef.on("value", snap => {
        const tasks = snap.val();
        let updates = {}
        Object.keys(tasks).forEach(id => {
            if(tasks[id].type === "tenyleges"){
                updates[id + "/type"] = "regular"
            } else if(tasks[id].type === "folyamatos"){
                updates[id + "/type"] = "continuous"
            } else if(tasks[id].type === "kategoria"){
                updates[id + "/type"] = "category"
            } 
            

        })
        tasksRef.update(updates)
        dispatch({
            type: 'GET_TASKS',
            tasks: Object.keys(tasks).map(key => {
                return {
                    ...tasks[key],
                    id: key
                }
            })
        })
        dispatch({type: 'GET_TASK_EVENTS'})
    })
}

export const changeRanks = (list) => {
    let update = {};
    list.forEach((task, i) => {
        update[task.id + "/rank"] = true;
        update[task.id + "/rank"] = i + 1;
    })
    tasksRef.update(update)
}
export const newEvent = (name, date, top, bot, taskId) => {
    const newEventRef = eventsRef.push();
    newEventRef.set({
        name,
        date,
        top,
        bot,
        taskId: taskId || null,
        type: "event"
    })
    taskId && tasksRef.child(taskId).update({inCal: true})
}

export const changeEvent = (id, top, bot) => {
    eventsRef.child(id).update({top, bot})
}

export const deleteEvent = (id, taskId) => {
    eventsRef.child(id).remove();
    if(taskId){
        tasksRef.child(taskId).update({inCal: false})
    }
}

export const eventStarted = (id, date, eventTop, breakTop, tasks) => async dispatch => {
    eventsRef.child(id).update({rTop: eventTop})
    if(breakTop){
        const newBreakRef = eventsRef.push();
        newBreakRef.set({
            name: "Break",
            top: breakTop,
            bot: eventTop,
            type: "break",
            date
        })
    }
    if(tasks.length){
        let tasksToStart = {};
        tasks.forEach(taskId => {
            tasksToStart[taskId + "/start"] = true;
            tasksToStart[taskId + "/start"] = date;
        })
        tasksRef.update(tasksToStart)
    }
    dispatch({type: 'EVENT_STARTED', rTop: eventTop})
}
export const eventCompleted = (id, date, rBot, tasks) => async dispatch => {
    eventsRef.child(id).update({rBot});
    if(tasks.length){
        let tasksToEnd = {};
        tasks.forEach(taskId => {
            tasksToEnd[taskId + "/end"] = true;
            tasksToEnd[taskId + "/end"] = date;

            tasksToEnd[taskId + "/status"] = true;
            tasksToEnd[taskId + "/status"] = "completed";
        })
        tasksRef.update(tasksToEnd)
    }
    dispatch({type: 'EVENT_COMPLETED', rBot})
}

export const breakStarted = (name, date, top) => async dispatch => {
    const newBreakRef = eventsRef.push();
    const id = newBreakRef.key;
    newBreakRef.set({
        name: Boolean(name) ? name : "Break",
        top: top,
        type: "break",
        date
    })
    dispatch({type: 'BREAK_STARTED', id, name, top})
}

export const breakCompleted = (id, bot) => async dispatch => {
    eventsRef.child(id).update({bot});
    dispatch({type: 'BREAK_COMPLETED', bot});
}


export const deleteTask = (deletable) => {
    let update = {};
    deletable.forEach(id => {
        update[id] = true;
        update[id] = null;
    })
    tasksRef.update(update)
}

export const newTask = (name, type, pId) => async dispatch => {
    const newTask = {
        name,
        type,
        pId,
        rank: 0,
        status: "letezo",
        inCal: false
    }
    const id = tasksRef.push().key;
    tasksRef.child(id).set(newTask);
    dispatch({type: 'NEW_TASK', task: {...newTask, id}})
}

export const taskNameEdit = (id, name) => {
    tasksRef.child(id).update({name})
}

export const taskTimeEdit = (id, timeValue, timeType) => {
    tasksRef.child(id).update({timeValue, timeType})
}

export const taskChangingParent = id => async dispatch => {
    dispatch({
        type: 'MOVE_TASK_START',
        moveWhich: id
    })
}

export const taskChangeParent = (which, where) => async dispatch => {
    tasksRef.child(which).update({pId: where})
    dispatch({type: 'MOVE_TASK_COMPLETE'})
}