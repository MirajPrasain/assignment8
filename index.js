'use strict'

const express = require('express');
const nedb = require("nedb-promises");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const db = nedb.create('users.jsonl');
const SECRET_KEY = "your_secret_key"; // should be in .env file

app.use(express.static('public'));
app.use(express.json());

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).send("Access Denied");
    jwt.verify(token, SECRET_KEY, (err, decodedUser) => {
        if (err) return res.status(403).send("Invalid Token");
        req.user = decodedUser;
        next();
    });
};

// GET /users - return all users (no passwords, hashes, or tokens)
app.get('/users', (req, res) => {
    db.find({}, { username: 1, _id: 0 })
        .then(docs => res.send(docs))
        .catch(error => res.send({ error }));
});

// POST /users/auth - login
app.post('/users/auth', (req, res) => {
    const { username, password } = req.body;
    db.findOne({ username })
        .then(doc => {
            if (!doc) return res.send({ error: 'Username not found.' });
            if (!bcrypt.compareSync(password, doc.passhash)) return res.send({ error: 'Username and password do not match.' });
            const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
            return db.update({ username }, { $set: { authToken: token } })
                .then(() => res.send({ auth: token, username: doc.username, name: doc.name, email: doc.email }));
        })
        .catch(error => res.send({ error }));
});

// POST /users - register
app.post('/users', (req, res) => {
    if (!req.body.username || !req.body.password || !req.body.email || !req.body.name)
        return res.send({ error: 'Missing fields.' });
    db.findOne({ username: req.body.username })
        .then(doc => {
            if (doc) return res.send({ error: 'Username already exists.' });
            const token = jwt.sign({ username: req.body.username }, SECRET_KEY, { expiresIn: '1h' });
            const userDoc = {
                username: req.body.username,
                passhash: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync()),
                name: req.body.name,
                email: req.body.email,
                authToken: token
            };
            return db.insert(userDoc)
                .then(newDoc => res.send({ auth: token, username: newDoc.username, name: newDoc.name, email: newDoc.email }));
        })
        .catch(error => res.send({ error }));
});

// PATCH /users/:username - update (requires auth token)
app.patch('/users/:username', authenticateToken, (req, res) => {
    db.update({ username: req.params.username }, { $set: req.body })
        .then(numUpdated => {
            if (!numUpdated) return res.send({ error: 'Something went wrong.' });
            res.send({ ok: true });
        })
        .catch(error => res.send({ error }));
});

// DELETE /users/:username - delete (requires auth token)
app.delete('/users/:username', authenticateToken, (req, res) => {
    db.remove({ username: req.params.username })
        .then(numDeleted => {
            if (!numDeleted) return res.send({ error: 'Something went wrong.' });
            res.send({ ok: true });
        })
        .catch(error => res.send({ error }));
});

// POST /users/logout - delete auth token
app.post('/users/logout', authenticateToken, (req, res) => {
    db.update({ username: req.user.username }, { $unset: { authToken: true } })
        .then(() => res.send({ ok: true }))
        .catch(error => res.send({ error }));
});

app.all('/{*path}', (req, res) => { res.status(404).send('Invalid URL.') });
app.listen(3000, () => console.log("Server started on http://localhost:3000"));