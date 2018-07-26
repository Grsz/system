const hónapok = [
    "Jan.",
    "Feb.",
    "Már.",
    "Ápr.",
    "Máj.",
    "Jún.",
    "Júl.",
    "Aug.",
    "Szep.",
    "Okt.",
    "Nov.",
    "Dec"
];
const napok = [
    'Hé.',
    'Ke.',
    'Sze.',
    'Csü.',
    'Pé.',
    'Szo.',
    'Va.'
];
const dateToDayOfYear = (dateString) => {
    var now = new Date(dateString);
    var start = new Date(now.getFullYear(), 0, 0, 22);
    var diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.round(diff / oneDay);
    return day
};
const dayOfYearToDate = (day) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), 0);
    return new Date(date.setDate(day) + 60000000);
}
const daysInThisMonth = () => {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
}
const daysOfWeek = () => {
    const now = new Date();
    const dayOfYear = dateToDayOfYear(now);
    const dayOfWeek = now.getDay();
    const daysOfWeek = [];
    if(dayOfWeek === 0){
        let count = dayOfYear;
        for(let i = 6; i >= 0; i--){
            console.log(dayOfYearToDate(count))
            daysOfWeek[i] = count;
            count--;
        }
    } else {
        for(let i = 0; i < 7; i++){
            daysOfWeek[i] = dayOfYear - dayOfWeek + i + 1
        }
    }
    return daysOfWeek
}
const compareDates = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear()
        && d1.getDate() === d2.getDate()
        && d1.getMonth() === d2.getMonth();
}
const convertDateToTlDay = (date) => dateToDayOfYear(date) - startDayOfYear;
let startDate = new Date(2018, 4, 24, 1, 1, 1),
startDayOfYear = dateToDayOfYear(startDate),
startMonth = startDate.getMonth(),

today = new Date(),
todayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1,
todayOfYear = dateToDayOfYear(today),
tlToday = todayOfYear - startDayOfYear,

currentMonth = today.getMonth(),

firstDayOfMonth = new Date(today.getFullYear(), currentMonth, 1, 1, 1, 1),
firstDayOfYearOfMonth = dateToDayOfYear(firstDayOfMonth),
tlFirstDayOfYearOfMonth = firstDayOfYearOfMonth - startDayOfYear,

lastDayOfMonth = new Date(today.getFullYear(), currentMonth, daysInThisMonth(), 1, 1, 1),
lastDayOfYearOfMonth = dateToDayOfYear(lastDayOfMonth),
tlLastDayOfYearOfMonth = lastDayOfYearOfMonth - startDayOfYear,

datesOfWeek = daysOfWeek().map(nap => dayOfYearToDate(nap)),
daysOfYearOfWeek = daysOfWeek(),
tlDaysOfYearOfWeek = daysOfYearOfWeek.map(nap => nap - startDayOfYear);
console.log(lastDayOfMonth, today, currentMonth, daysInThisMonth(), )
export {
    hónapok,
    napok, 
    compareDates,
    convertDateToTlDay,
    dateToDayOfYear, 
    dayOfYearToDate, 
    daysOfWeek,
    datesOfWeek,
    startDate, 
    startDayOfYear, 
    startMonth, 
    today,
    todayOfYear,
    tlToday,
    currentMonth,
    daysInThisMonth,
    firstDayOfMonth,
    firstDayOfYearOfMonth,
    tlFirstDayOfYearOfMonth,
    lastDayOfMonth,
    lastDayOfYearOfMonth,
    tlLastDayOfYearOfMonth,
    daysOfYearOfWeek,
    tlDaysOfYearOfWeek,
    todayOfWeek
}