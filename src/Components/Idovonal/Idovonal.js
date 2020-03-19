import React from 'react';
import './Idovonal.css';
import {
    hónapok,
    napok, 
    dateToDayOfYear, 
    dayOfYearToDate, 
    daysInThisMonth, 
    daysOfWeek,
    datesOfWeek,
    startDate, 
    startDayOfYear, 
    startMonth, 
    today,
    todayOfYear,
    tlToday,
    currentMonth,
    firstDayOfMonth,
    firstDayOfYearOfMonth,
    tlFirstDayOfYearOfMonth,
    lastDayOfMonth,
    lastDayOfYearOfMonth,
    tlLastDayOfYearOfMonth,
    daysOfYearOfWeek,
    tlDaysOfYearOfWeek,
    todayOfWeek,
    convertDateToTlDay
} from '../../Ido.js'
import { faThumbsDown } from '@fortawesome/free-solid-svg-icons';

class Idovonal extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            categories: [],
            rows: 0,
            columns: 0,
            width: 0,
            height: 0,
            display: "months",
            taskDims: {},
            dragX: null,
            gridUnit: 0
        }
    }
    isDragging = false;
    componentDidMount(){
        this.state.tasks["months"].forEach(task => {
            Object.keys(this).forEach(key => {
                if(key === task.id){
                    this.setState( prevState => {
                        const taskDims = {...prevState.taskDims};
                        taskDims[task.id] = true;
                        taskDims[task.id] = this[task.id].getBoundingClientRect();
                        return {taskDims}
                    })
                }
            })
        })
    }
    static getDerivedStateFromProps(nextProps){
        //át kell variálni, hogy ne a gdsfp legyen, mert nem lehet benne olvasni a this.statet
        //ide egy var, ami egy array, és tartalmazza a displays nevét (mint string), majd foreach rajtuk egészen a returnig, a sorokkal, és oszlopokkal kell majd kezdeni valamit. Meg a kategóriákkal.


        let taskCont = {},
        //az taskCont szimplán az összes task display szerinti kategorizálása
        directTaskCont = {},
        rootParent = [],
        //az rootParent az a külön switches csoportfát alkotó legfelső task, azaz a kategóriák közvetlen gyermeke
        columns = 0,
        rows = 0,
        displays = ["months", "weeks", "days"];
        displays.forEach(display => {
            let tasks = nextProps.tasks
            .filter(elem => elem.timeType === display && elem.type !== "category")
            .map(task => {
                const child = [];
                nextProps.tasks.forEach(element => {
                    if (element.pId === task.id){
                        child.push(element.id)
                    }
                })
                const length = () => {
                    const time = Number(task.timeValue);
                    if(display === "months"){
                        return time * 30
                    }
                    else if(display === "weeks"){
                        return time * 7
                    }
                    else{
                        return time
                    }
                }
                return {
                    name: task.name,
                    id: task.id,
                    pId: task.pId,
                    rank: task.rank,
                    length: length(),
                    child: child,
                    rColStart: task.start ? convertDateToTlDay(task.start) : null,
                    rColEnd: task.end ? convertDateToTlDay(task.end) : null,
                    rLength: task.start && task.end ? convertDateToTlDay(task.end) - convertDateToTlDay(task.start) : null
                }
            })
            ;
            let directTasks = [];
            //ez a rész arra szolgál, hogy beállítsuk a feladatoknak az lnkflt
            do{tasks
                .filter(task => task.type !== "continuous" && task.type !== "category")
                .forEach(task => {
                    let gotParent = false
                    tasks.forEach(parent => {
                        if(task.pId === parent.id && task.id !== parent.id){
                            //ha a feladatnak van szüleje, akkor task.rootParent = parent.rootParent
                            if(parent.rootParent){
                                task.rootParent = parent.rootParent
                            }
                            return gotParent = true
                        }
                    })
                    
                    if(!gotParent && !task.rootParent){
                        //ha se szüleje nincs, se rootParent, akkor
                        if(directTasks.findIndex(directTasks => directTasks.id === task.id) === -1){
                            //ha nincs benne a directTasks listában, akkor
                            Object.assign(task, {level: 1, biggestParentInDisplay: task.id})
                            //a task a display legnagyobb szüleje
                            if(Object.keys(taskCont).length !== 0){
                                //ha a tasks listája nem üres
                                Object.keys(taskCont).forEach(group => {
                                    //az taskCont minden nézetcsoportján végigloopolunk
                                    const parent = taskCont[group].find(elem => elem.id === task.pId);
                                    //megkerssük a task szülejét a feladatokban
                                    if(parent !== undefined){
                                        //ha megvan, akkor a task lnkflje a szüleje lnkflje
                                        task.rootParent = parent.rootParent
                                    }
                                });
                                if(!task.rootParent){
                                    //ha nincs meg, akkor a task maga egy rootParent
                                    if(rootParent.findIndex(rootParent => rootParent === task.id) === -1){
                                        rootParent.push(task.id)
                                    }
                                    task.rootParent = task.id
                                    task.colStart = task.rColStart ? task.rColStart : 0
                                }
                            }
                            else{
                                //ha üres a tasks listája
                                if(rootParent.findIndex(rootParent => rootParent === task.id) === -1){
                                    //és a task még nincs benne az lnkflek listájában, akkor belerakjuk
                                    rootParent.push(task.id)
                                }
                                task.rootParent = task.id
                                task.colStart = task.rColStart ? task.rColStart : 0
                            }
                            //ha a feladatnak nincs szüleje a nézetben, akkor mindenképpen directTasks lesz
                            directTasks.push(task)
                        }
                    }
            })} while (!tasks.every(task => task.rootParent))
            //ez arra szolgál, hogy a feladatoknak beállítsuk a szintjét, és a legnagyobbszülőidjét
            do{tasks.forEach(elem => {
                elem.child.forEach(child => {
                    tasks.forEach(childCategory => {
                        if(child === childCategory.id && elem.level !== 0){
                            //ha a feladatnak van szintje, és megtaláltuk a közvetlen gyermekeit, akkor
                            childCategory.level = elem.level + 1
                            //a task közvetlen gyermekeinek beállítjuk a task szintjét + 1

                        }
                        if(child === childCategory.id && elem.biggestParentInDisplay){
                            //ha az elemnek van legnagyobbszülőidje, akkor a gyermekeinek is ugyanaz
                            childCategory.biggestParentInDisplay = elem.biggestParentInDisplay
                        }
                    })
                })
            })} while (tasks.some(elem => elem.level === 0))
            //itt a tasks rangsorolását állítjuk be a rangjuk, és a szülőgyerek kapcsolat alapján
            tasks = tasks.map(({child, ...p}) => ({
                child: child
                    .map((pid) => nextProps.tasks.find(({id: cid}) => pid === cid))
                    .sort(({rank: a}, {rank: b}) => a - b)
                    .map(({id} = {}) => id),
                ...p
            }));
            

            tasks.sort((a, b) => {
                var o1 = a.level;
                var o2 = b.level;
            
                var p1 = a.rank;
                var p2 = b.rank;
            
                if (o1 < o2) return -1;
                if (o1 > o2) return 1;
                if (p1 < p2) return -1;
                if (p1 > p2) return 1;
                return 0;
            })
            //a közvetlenflek (a display szülei) sorjait állítjuk be (azonos időtípussal hány gyermeke van)
            directTasks.forEach(directTasks => {
                const rows = Math.max(
                    ...tasks
                    .filter(task => task.biggestParentInDisplay === directTasks.biggestParentInDisplay)
                    .map(task => task.level)
                )
                directTasks.rows = rows
            })
            //az adott display kfljének beállítjuk az összegyűjtött kfleket, és az összes nézetbeli feladatot
                directTaskCont[display] = directTasks;
                taskCont[display] = tasks;
            })
            //ez a dátumkezdeteket állítja be
            do{Object.keys(taskCont).forEach(display => {
                taskCont[display].forEach(parent => {
                    if(parent.colStart || parent.colStart === 0){
                        let lengthCounter = parent.colStart;
                        parent.child.forEach(child => {
                            //ha az elemnek van directTasks gyereke, az biztosan egy másik nézetben van, megkeressük
                            Object.keys(directTaskCont).forEach(directTaskGroup => {
                                directTaskCont[directTaskGroup].filter(childDirectTask => childDirectTask.id === child).forEach(childDirectTask => {
                                    //ha van, akkor megkeressük a directTasks gazdáját is
                                    Object.keys(taskCont).forEach(group => {
                                        taskCont[group].forEach(task => {
                                            if(task.id === childDirectTask.id){
                                                if(task.rColStart){
                                                    lengthCounter = task.rColStart;
                                                }
                                                task.colStart = lengthCounter
                                                //és beállítjuk mindkettőnek a számlálót
                                                childDirectTask.colStart = lengthCounter;
                                                //és hozzáadjuk a számlálóhoz.
                                                lengthCounter += childDirectTask.rLength ? childDirectTask.rLength : childDirectTask.length;
                                            }
                                        })
                                    })
                                })
                            })
                            //az elem saját csoportján belüli gyerekeinek megkeresése (de amúgy lehet ezt a lépést feljebb a sorkezdeteknél is be lehet állítani)
                            taskCont[display].filter(childInDisplay => childInDisplay.id === child).forEach(childInDisplay =>{
                                childInDisplay.colStart = lengthCounter;
                                lengthCounter += childInDisplay.rLength ? childInDisplay.rLength : childInDisplay.length;
                            })
                        })
                    }
                })
            })} while(!Object.keys(taskCont).every(group => taskCont[group].every(task => (task.colStart || task.colStart === 0))))



            let categories = nextProps.tasks
            .filter(elem => elem.type === 'category')
            .map(category => {
                const child = [];
                nextProps.tasks.forEach(element => {
                    if (element.pId === category.id){
                        child.push(element.id)
                    }
                })
                return {
                    name: category.name,
                    id: category.id,
                    pId: category.pId,
                    rank: category.rank,
                    level: category.id === "root" ? 1 : 0,
                    length: 0,
                    ...category.id === "root" ? {rowStart: 2} : {},
                    child: child,
                    added: false,
                    tasksCheck: false
                }
            })
            
            do{categories.forEach(elem => {
                if(!elem.tasksCheck){
                    elem.child.forEach(child => {
                        if(!categories.some(category => category.id === child)){
                            elem.length++
                        } 
                    })
                    elem.tasksCheck = true
                }
                let added = true
                elem.child.forEach(child => {
                    categories.forEach(childCategory => {
                        //ha a gyerek id megtalálható a kategóriák között, és az aktuális kategória szintje nem 0, akkor a gyerek (object) szintjét állítsa sajátja + 1-re
                        if(child === childCategory.id && elem.level !== 0){
                            childCategory.level = elem.level + 1
                        }
                        //ha a gyerek id megtalálható a kategóriákban, és az object added propja hamis, akkor a added elem is hamis
                        //ez annyit tesz, hogy elérjük, hogy lentről fel (a kategóriákon belül) működjön a hosszok beállítása. (erre a feladatoknál azért nincs szükség, mert ott a length alapból megvan.). A legalsó elemeknél ahol nincs kategória gyerek, ott a added igaz marad, a következő részben pedig a propban is igazzá tesszük.
                        if(child === childCategory.id && childCategory.added === false){
                            added = false
                        }
                    })
                })
                //ha az előző teszt sikeres volt, azaz a added elem igaz maradt, viszont az aktuális kategória még nem lett hozzáadva a szülejéhez, akkor beállítjuk, hogy az elem hozzá lett adva, majd pedig hozzáadjuk...
                if (added && !elem.added){
                    elem.added = true;
                    categories.forEach(parent => {
                        //ha az elem szülejét megtaláltuk a listában, akkor az aktuális kategória hosszát hozzáadjuk a szülőhöz.
                        if(elem.pId === parent.id){
                            parent.length += elem.length
                        }
                    })
                }
            })
            } while (categories.some(elem => elem.level === 0) && categories.some(elem => elem.added === false))

            categories = categories.map(({child, ...p}) => ({
            child: child
            .map((pid) => nextProps.tasks.find(({id: cid}) => pid === cid))
            .sort(({rank: a}, {rank: b}) => a - b)
            .map(({id} = {}) => id),
            ...p
            }));
            categories.sort((a, b) => {
                var o1 = a.level;
                var o2 = b.level;

                var p1 = a.rank;
                var p2 = b.rank;

                if (o1 < o2) return -1;
                if (o1 > o2) return 1;
                if (p1 < p2) return -1;
                if (p1 > p2) return 1;
                return 0;
            })

            columns = Math.max(...categories.map(elem => elem.level));
            rows = Math.max(...categories.map(elem => elem.length))

            do{
                categories.forEach(elem => {
                    let rowCounter = 0;
                    if(elem.rowStart){
                        rowCounter = elem.rowStart;
                    }
                    elem.child.forEach(child => {
                        categories.forEach(childCategory => {
                            if(child === childCategory.id && elem.rowStart){
                                childCategory["rowStart"] = rowCounter;
                                rowCounter += childCategory.length;
                            }
                        })
                        Object.keys(directTaskCont).forEach(display => {
                            directTaskCont[display].forEach(rootParent => {
                                if(child === rootParent.id && elem.rowStart){
                                    rootParent["rowStart"] = rowCounter;
                                    rowCounter ++
                                    Object.keys(directTaskCont).forEach(group => {
                                        directTaskCont[group].forEach(directTasks => {
                                            if(directTasks.rootParent === child){
                                                directTasks.rowStart = rootParent.rowStart
                                            }
                                        })
                                    })
                                }
                            })
                        })
                    })
                })
            } while (!categories.every(elem => elem.rowStart) || !Object.keys(directTaskCont).every(group => directTaskCont[group].every(directTasks => directTasks.rowStart)))


        return{
            rootParent: rootParent,
            categories: categories,
            rows: rows,
            columns: columns,
            tasks: taskCont,
            directTasks: directTaskCont,
            startDate: startDate,
            startDayOfYear: startDayOfYear,
            startMonth: startMonth,
            today: today,
            todayOfYear: todayOfYear,
            tlToday: tlToday,
            currentMonth: currentMonth,
            daysInThisMonth: daysInThisMonth(),
            firstDayOfMonth: firstDayOfMonth,
            lastDayOfMonth: lastDayOfMonth,
            firstDayOfYearOfMonth: firstDayOfYearOfMonth,
            lastDayOfYearOfMonth: lastDayOfYearOfMonth,
            tlFirstDayOfYearOfMonth: tlFirstDayOfYearOfMonth,
            tlLastDayOfYearOfMonth: tlLastDayOfYearOfMonth,
            daysOfYearOfWeek: daysOfYearOfWeek,
            tlDaysOfYearOfWeek: tlDaysOfYearOfWeek
        }

    }
    categories = () => {
        const categoryElements = this.state.categories.map(category => {
            return <div className = 'tlCategory' style={{
                gridRow: `${category.rowStart - 1} / span ${category.length}`,
                gridColumn: category.level + "/ span 1",
            }}> 
                <p>{category.name}</p>
            </div>
        })
        return <div className = 'catCont' style = {{
            display: 'grid',
            gridTemplateColumns: `repeat(${this.state.columns}, 100px)`,
            gridTemplateRows: `repeat(${this.state.rows}, 1fr)`,
            gridRow: '2 / span ' + this.state.rows,
            gridColumn: '1 / 2'
        }}>
            {categoryElements}
        </div>

        
    }
    tasksRows = () => {
        const {display, directTasks, tasks, rootParent} = this.state;
        //dátumkezdet alapján az összes task nézettől függően bekerül a gridbe, csak a date alapján amiknek nem kell látszania, azok 0
        const filterTasksByDisplay = () => {
            if(display === "months"){
                return "repeat(180, 1fr)"
            }
            else if(display === "weeks"){
                if(this.state.tlFirstDayOfYearOfMonth < 0){
                    return `repeat(${this.state.tlLastDayOfYearOfMonth}, 1fr) repeat(${180 - this.state.tlLastDayOfYearOfMonth}, 0)`
                }
                else{
                    return `repeat(${this.state.tlFirstDayOfYearOfMonth}, 0) repeat(${this.state.daysInThisMonth}, 1fr) repeat(${180 - this.state.tlLastDayOfYearOfMonth}, 0)`
                }
            }
            else if(display === "days"){
                return `repeat(${this.state.tlDaysOfYearOfWeek[0]}, 0) repeat(7, 1fr) repeat(${180 - this.state.tlDaysOfYearOfWeek[6] + 1}, 0)`
            }
        }


        return rootParent.map(rootParent => {
            const rowStart = () => {
                const elem = directTasks[display].find(directTask => directTask.rootParent === rootParent)
                return elem.rowStart
            }
            const row = () => {
                const length = (e) => {
                    if(e.rColStart){
                        const currentLength = e.rColEnd ? 
                        e.rColEnd - e.rColStart : tlToday - e.rColStart;
                        
                        if(currentLength > e.length){
                            return currentLength
                        } else {
                            return e.length
                        }
                    } else {
                        return e.length
                    }
                }
                const progress = (e) => {
                    if(e.rColStart){
                        if(e.rColEnd){
                            if(e.rLength > e.length){
                                //túllógással (be kell állítani minden feladatnak hogy grid legyen, és hogy a hosszának megfelelő gridcoltemp)
                                return <React.Fragment> 

                                    <div className='progressInTime' style={{
                                        gridColumn: `1 / span ${e.length}`,
                                    }}>
                                        <p className='tlTaskName'>{e.name}</p>
                                    </div>

                                    <div className='progressOverTime' style ={{
                                        //gridColumn: `${e.length} / span ${e.rLength - e.length}`
                                        gridColumn: `span ${e.rLength - e.length} / -1`
                                    }}></div>

                                </React.Fragment>
                            } else {
                                //hamarabb kész lett
                                return <div className='progressInTime' style={{
                                    gridColumn: `1 / span ${length(e)}`,
                                }}>
                                    <p className='tlTaskName'>{e.name}</p>
                                </div>
                            }
                        } else {
                            //folyamatban van
                            const currentLength = tlToday - e.rColStart;
                            if(currentLength > e.length){
                                //túllógásos
                                return <React.Fragment> 

                                <div className='progressInTime' style={{
                                    gridColumn: `1 / span ${e.length}`,
                                }}>
                                    <p className='tlTaskName'>{e.name}</p>
                                </div>

                                <div className='progressOverTime' style ={{
                                    //gridColumn: `${e.length} / span ${currentLength - e.length}`
                                    gridColumn: `span ${currentLength - e.length} / -1`
                                }}></div>
                                
                            </React.Fragment>
                            } else {
                                //nincs túllógás
                                return <div className='progressInTime' style={{
                                    gridColumn: `1 / span ${currentLength}`,
                                }}>
                                    <p className='tlTaskName'>{e.name}</p>
                                </div>
                            }
                        }
                    }
                }
                return directTasks[display]
                .filter(directTask => directTask.rootParent === rootParent)
                .map(directTask => {
                    const childTasks = () => {
                        return tasks[display]
                        .filter(task => task.biggestParentInDisplay === directTask.biggestParentInDisplay)
                        .map(task => {
                            return <div className = 'task' style={{
                                gridColumn: `${task.colStart - directTask.colStart + 1 } / span ${length(task)}`,
                                gridRowStart: task.level + ' / span 1',
                                backgroundColor: `rgba(42, ${255 - (55 / task.level) }, 139, 0.76)`,
                                gridTemplateColumns: `repeat(${length(task)}, 1fr)`,
                            }}>
                                {progress(task)}
                                <p className='tlTaskName'>{task.name}</p>
                            </div>
                        })
                    }
                    const check = (task, display) => !task.rColStart && display === 'months';
                    
                    const onDown = (e, task) => {
                        this.isDragging = true;
                        this.setState({
                            gridUnit: length(task) / this.state.taskDims[task.id].width,
                        })
                    }
                    return <div 
                        className = 'directTask' 
                        style = {{
                            gridColumn: `${this.state.dragX || directTask.colStart + 1} / span ${length(directTask)}`,
                            gridTemplateColumns: `repeat( ${length(directTask)} , 1fr)`,
                            gridTemplateRows: "repeat(" + directTask.rows + ", 1fr)"
                        }}
                        ref={e => this[directTask.id] = e}
                        //onPointerDown={e => onDown(e, directTask)}
                    >
                        {childTasks()}
                    </div>
                })
            }

            if(row().length){
                return <div className = 'row' style = {{
                    gridRow: rowStart() + " / span 1",
                    gridColumn: "start",
                    display: "grid",
                    gridTemplateColumns: filterTasksByDisplay(),
                    gridTemplateRows: "1fr",
                }}>
                    {row()}
                    <div className = 'tlLineX'></div>
                </div>
            }
        })
    }
    getElementDims = (elem, task) => {
        //if(check(task, display)){
            //this.setState( prevState => {
                //const taskDims = {...prevState.taskDims};
                //taskDims[task.id] = true;
                //taskDims[task.id] = elem.getBoundingClientRect();
                //return {taskDims}
                //return {prevState}
            //})
            const dims = elem ? elem.getBoundingClientRect() : null
            if(dims){
                this.setState({
                    taskDims: dims
                })
            }
        //}
    }
    getMonthDims = (e) => {
    }
    header(){
        const columns = () => {
            if(this.state.display === "months"){
                return `repeat(180, 1fr)`
            }
            if(this.state.display === "weeks"){
                return `1fr`
            }
            if(this.state.display === "days"){
                return `repeat(7, 1fr)`
            }
        }
        const headerElements = () => {

            if(this.state.display === "months"){
                const halfYear = [];
                let colCounter = 0;
                for(let i = this.state.startMonth;;){
                    if(i === this.state.startMonth){

                        const daysOfStartMonth = new Date(this.state.startDate.getFullYear(), this.state.startDate.getMonth()+1, 0).getDate(),
                        lastDayOfStartMonth = new Date(this.state.startDate.getFullYear(), this.state.startMonth, daysOfStartMonth, 1, 1, 1),
                        lastDayOfYearOfStartMonth = dateToDayOfYear(lastDayOfStartMonth),
                        tlLastDayOfYearOfStartMonth = lastDayOfYearOfStartMonth - startDayOfYear;


                        colCounter += tlLastDayOfYearOfStartMonth;
                        halfYear.push(
                            <div className = 'dateBlock' style = {{
                                    gridColumn: `1 / span ${colCounter + 1}`,
                                    gridRow: "2 / span 1",
                                }}
                                ref={e => this.getMonthDims(e)}
                            >
                                <div className = 'tlLineY'></div>
                                <p className = 'months'>{hónapok[i]}</p>
                            </div>
                        )
                        i++
                    }
                    else {
                        if(i === 12){
                            i = 0;
                        }
                        if(colCounter + 30 >= 180){
                            halfYear.push(
                                <div className = 'dateBlock' style = {{
                                        gridColumnStart: colCounter + 2,
                                        gridColumnEnd: '-1',
                                        gridRow: "2 / span 1",
                                    }}
                                    ref={e => this.getMonthDims(e)}
                                >
                                    <div className = 'tlLineY'></div>
                                    <p className = 'months'>{hónapok[i]}</p>
                                </div>
                            )
                            break
                        }
                        else {
                            halfYear.push(
                                <div className = 'dateBlock' style = {{
                                        gridColumn: `${colCounter + 2} / span 30`,
                                        gridRow: "2 / span 1",
                                    }}
                                    ref={e => this.getMonthDims(e)}
                                >
                                    <div className = 'tlLineY'></div>
                                    <p className = 'months'>{hónapok[i]}</p>
                                </div>
                            )
                            colCounter += 30
                            i++
                        }
                    }
                }
                halfYear.push(
                    <div className = 'dateBlock year' style = {{
                        gridColumnStart: '1',
                        gridColumnEnd: '-1',
                        gridRow: '1 / span 1'
                    }}>
                        <p>{this.state.startDate.getFullYear()}</p>
                    </div>
                )
                return halfYear
            }


            else if(this.state.display === "weeks"){
                let colCounter = 0;
                let daysInThisMonth;
                let firstDay;
                if(this.state.tlFirstDayOfYearOfMonth < 0){
                    daysInThisMonth = this.state.tlLastDayOfYearOfMonth;
                    firstDay = this.state.startDate.getDay() - 1;
                }
                else{
                    daysInThisMonth = this.state.daysInThisMonth;
                    firstDay = this.state.firstDayOfMonth.getDay() - 1;
                }
                const weeksElements = () => {
                    const weeks = [];
                    for(let i = 1;; i++){
                        if(i === 1){
                            if(firstDay === -1){
                                colCounter++
                                weeks.push(
                                    <div className = 'dateBlock' style = {{
                                        gridColumn: "1 / span 1",
                                        gridRow: "2 / span 1",
                                    }}>
                                        <div className = 'tlLineY'></div>
                                        <p>{"1. weeks"}</p>
                                    </div>
                                )
                            }
                            else {
                                colCounter += 7 - firstDay
                                weeks.push(
                                    <div className = 'dateBlock' style = {{
                                        gridColumn: "1 / span " + colCounter,
                                        gridRow: "2 / span 1",
                                    }}>
                                        <div className = 'tlLineY'></div>
                                        <p>{"1. weeks"}</p>
                                    </div>
                                )
                            }
                        }
                        else {
                            if(colCounter + 7 >= daysInThisMonth){
                                weeks.push(
                                    <div className = 'dateBlock' style = {{
                                        gridColumn: (colCounter + 1) + " / span " + (daysInThisMonth - colCounter),
                                        gridRow: "2 / span 1",
                                    }}>
                                        <div className = 'tlLineY'></div>
                                        <p>{i + ". weeks"}</p>
                                    </div>
                                )
                                break
                            }
                            else {
                                weeks.push(
                                    <div className = 'dateBlock' style = {{
                                        gridColumn: (colCounter + 1) + " / span 7",
                                        gridRow: "2 / span 1",
                                    }}>
                                        <div className = 'tlLineY'></div>
                                        <p>{i + ". weeks"}</p>
                                    </div>
                                )
                                colCounter += 7
                            }
                        }
                    }
                    return weeks
                }
                return <div style = {{
                    display: 'grid',
                    gridRow: '1 / 3',
                    gridColumn: 1 + '/ span 1',
                    gridTemplateColumns: `repeat(${daysInThisMonth}, 1fr)`,
                    gridTemplateRows: '1fr 1fr'
                }}>
                    <div className = 'dateBlock month' style = {{
                        gridColumnStart: '1',
                        gridColumnEnd: '-1',
                        gridRow: '1 / 2'
                    }} >
                        <p>{hónapok[this.state.currentMonth]}</p>
                    </div>
                    {weeksElements()}
                </div>
            }


            else if(this.state.display === "days"){
                const daysOfWeek = [];
                for(let i = 0; i < 7; i ++){
                    daysOfWeek.push(
                        <div className = 'dateBlock' style = {{
                            gridColumn: 1 + i + ' / span 1',
                            gridRow: '1 / span 2',
                        }}>
                            <div className = 'tlLineY'></div>
                            <div className = 'date'>
                                <p>{hónapok[dayOfYearToDate(this.state.daysOfYearOfWeek[i]).getMonth()]}</p>
                                <p>{dayOfYearToDate(this.state.daysOfYearOfWeek[i]).getDate()}</p>
                            </div>
                            <p className = 'days'>{napok[i]}</p>
                        </div>
                    )
                }
                return daysOfWeek
            }
        }
        return <div className = 'tlHeader' style = {{
            gridColumn: `2 / span 1`,
            gridRow: '1 / span 1',
            display: 'grid',
            gridTemplateColumns: columns(),
            gridTemplateRows: "2"
        }}>
            {headerElements()}
        </div>
    }
    changeDisplay = (display) => {
        this.setState({display})
    }
    active = (display) => {
        if(this.state.display === display){
            return{
                backgroundColor: 'rgba(42, 199, 139, 0.801)',
                color: 'rgb(255, 255, 255)'
            }
        }
        else{
            return{
                backgroundColor: 'rgb(255, 255, 255)',
                color: 'rgb(42, 199, 139)'
            }
        }
    }

    render(){
        return(
            <div className = 'timeline' style={{
                display: "grid",
                gridTemplateColumns: "auto [start] 1fr",
                gridTemplateRows: "100px repeat(" + this.state.rows + ", 150px)",
            }} >
                <div className = 'saroktakaro'>
                    <div style={this.active('months')} className = 'switchDateType' onClick = {() => this.changeDisplay('months')}>
                        <p>months</p>
                    </div>
                    <div style={this.active('weeks')} className = 'switchDateType' onClick = {() => this.changeDisplay('weeks')}>
                        <p>weeks</p>
                    </div>
                    <div style={this.active('days')} className = 'switchDateType' onClick = {() => this.changeDisplay('days')}>
                        <p>days</p>
                    </div>
                </div>
                {this.header()}
                {this.categories()}
                {this.tasksRows()}
            </div>
         )
    }
}
 export default Idovonal;