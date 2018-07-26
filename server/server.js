const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('knex')({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'hrger',
      password : 'Xezeru007',
      database : 'rendszer'
    }
  });

const app = express();

app.use(bodyParser.json());
app.use(cors())

app.get('/', (req,res) => {
    db('fl').select('*').where('allapot', 'letezo')
        .then(data => res.json(data))
        .catch(err => console.log(err))
})

app.post('/deletefl', (req,res) => {
    db('fl')
        .where('id', req.body.id)
        .update({allapot: 'torolt'})
        .then(function() {return db('fl')
            .select('*')
            .where('allapot', 'letezo')
        })
    .then(data => res.json(data))
    .catch(err => console.log(err))
})

app.put('/nevvalt', (req,res) => {
    db('fl')
        .where('id', req.body.id)
        .update({nev: req.body.nev})
        .then(function() {return db('fl')
            .select('*')
            .where('allapot', 'letezo')
        })
    .then(data => res.json(data))
    .catch(err => console.log(err))
})
/*app.put('/setrang', (req,res) => {
    db('fl')
        .where('id', req.body.id)
        .update({rang: req.body.rang})
    .then(res.status(200))
    .catch(err => console.log(err))
})*/
app.put('/setrang', (req,res) => {
    Promise.all(req.body.rangValt.map(fl => {
        return db('fl')
        .where('id', fl.id)
        .update({rang: fl.rang})
    }))
    .then(res.sendStatus(200))
    .catch(err => console.log(err))
})
app.put('/setido', (req,res) => {
    db('fl')
        .where('id', req.body.id)
        .update({
            idotipus: req.body.tipus,
            idoert: req.body.ertek
        })
        .then(function() {return db('fl')
            .select('*')
            .where('allapot', 'letezo')
        })
    .then(data => res.json(data))
    .catch(err => console.log(err))
})
app.put('/rangvalt', (req,res) => {
    Promise.all(req.body.lista.map((fl, i) => {
        return db('fl')
            .where('id', fl.id)
            .update({rang: i + 1})
    }))
    .then(() => db('fl').select('*').where('allapot', 'letezo'))
    .then(feladatok => {res.json(feladatok)})
    .catch(err => console.log(err))
})
app.put('/szulovalt', (req,res) => {
    db('fl')
    .where('id', req.body.melyiket)
    .update({szid: req.body.hova})
    .then(() => db('fl').select('*').where('allapot', 'letezo'))
    .then(feladatok => res.json(feladatok))
    .catch(err => console.log(err))
})

app.post('/ujfeladat', (req, res) => {
    const {nev, tipus, szid} = req.body;
    console.log(nev, tipus, szid)
    db('fl').insert({
        nev: nev,
        tipus: tipus,
        szid: szid,
        ...tipus === 'hianyos' ? { rang: -1 } : {},
        ...tipus === 'kategoria'? {idoert: req.body.idoert, idotipus: req.body.idotipus} : {}
    })
    .then(() => {console.log("sadasd"); return db('fl').select('*').where('allapot', 'letezo')})
    .then(data => res.json(data))
    .catch(err => console.log(err))
})

app.post('/events', (req, res) => {
    Promise.all(req.body.datumok.map(datum => {
        console.log(datum)
        return db('events')
            .select('nev', 'id', 'top', 'bottom', 'flid', 'rtop', 'rbottom', 'tipus')
            .where('date', datum)
    }))
    /*const actualDay = new Date();
    db('events')
        .select('nev', 'id', 'top', 'bottom', 'flid')
        .where('date', actualDay)*/
    .then(data => res.json(data))
    .catch(err => console.log(err))
})

app.post('/newevent', (req,res) => {
    const {date, nev, top, bottom, flid, tipus} = req.body;
    db('events').insert({
        date,
        nev,
        top,
        bottom,
        flid,
        tipus
    })
    .returning('*')
    .then(event => res.json(event[0]))
    .catch(err => console.log(err))
})
app.put('/deleteflevent', (req,res) => {
    db('fl')
        .where('id', req.body.flid)
        .update({naptarban: false})
    .then(res.sendStatus(200))
    .catch(err => console.log(err))
})
app.delete('/deleteevent', (req, res) => {
    db('events')
        .where('id', req.body.id)
        .del()
    .then(res.sendStatus(200))
    .catch(err => console.log(err))
})

app.put('/changeevent', (req, res) => {
    db('events')
        .where('id', req.body.id)
        .update({
            top: req.body.top,
            bottom: req.body.bottom
        })
        .returning(['top', 'bottom'])
    .then(params => res.json(params[0]))
    .catch(err => console.log(err))
})

app.put('/movedflevent', (req,res) => {
    db('fl')
        .where('id', req.body.id)
        .update({naptarban: true})
    .then(res.sendStatus(200))
    .catch(err => console.log(err))
})

app.put('/eventstarted', (req,res) => {
    console.log(req.body)
    db('events')
        .where('id', req.body.id)
        .update({rtop: req.body.top})
    .then(() => {
        if(req.body.breakTop){
            return db('events').insert({
                nev: "Szünet",
                top: req.body.breakTop,
                bottom: req.body.top,
                date: req.body.date,
                tipus: "break"
            })
        }
    })
    .then(res.sendStatus(200))
    .catch(err => console.log(err))
})

app.put('/eventcompleted', (req,res) => {
    db('events')
        .where('id', req.body.id)
        .update({rbottom: req.body.bottom})
    .then(res.sendStatus(200))
    .catch(err => console.log(err))
})
app.listen(3001, () => {
    console.log('running 3001')
})