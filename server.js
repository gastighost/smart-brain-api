const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const app = express();
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'gastonroxas',
        password: '',
        database: 'smart-brain'
    }
});

db.select('*').from('users').then(data => {
    console.log(data);
});

app.use(bodyParser.json());
app.use(cors());

const database = {
    users: [{
            id: '123',
            name: 'John',
            email: 'john123@gmail.com',
            password: 'cookies',
            entries: 0,
            joined: new Date()
        },
        {
            id: '124',
            name: 'Sally',
            email: 'sally123@gmail.com',
            password: 'bananas',
            entries: 0,
            joined: new Date()
        }
    ],
    login: [{
        id: '987',
        has: '',
        email: 'john123@gmail.com'
    }]
}

app.post('/signin', (req, res) => {
    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', req.body.email)
                    .then(user => {
                        return res.json(user[0])
                    })
                    .catch(error => res.status(400).json('Unable to get user'))
            } else {
                res.status(400).json('Wrong credentials');
            }
        })
        .catch(error => res.status(400).json('Wrong credentials'))
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
            trx.insert({
                    hash: hash,
                    email: email
                })
                .into('login')
                .returning('email')
                .then(loginEmail => {
                    return trx('users')
                        .returning('*')
                        .insert({
                            email: loginEmail,
                            name: name,
                            joined: new Date()
                        })
                        .then(user => {
                            return res.json(user[0])
                        })
                })
                .then(trx.commit)
                .catch(trx.rollback)
        })
        .catch(error => res.status(400).json('Unable to join'))
});

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    let found = false;
    db.select('*').from('users').where({
            id: id
        })
        .then(user => {
            if (user.length) {
                res.json(user[0]);
            } else {
                res.status(400).json('Not found!')
            }
        })
        .catch(error => res.status(400).json('Error getting user'));
})


app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0]);
        })
        .catch(error => res.status(400).json('Unable to get entries'))
})
app.listen(3000, () => {
    console.log('App is running on port 3000')
});