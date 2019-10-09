const envs = require('./.env')
const axios = require('axios');
const cors = require('cors');
const express = require('express');
const app = express();
const path = require('path');
const db = require('./db');
const { User, Login } = db.models;
const jwt = require('jwt-simple');
const qs = require('querystring');
const session = require('express-session');
process.env = { ...process.env, ...envs }


app.use(session({
    secret: process.env.SESSION
}))
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3000;
db.syncAndSeed()
    .then(() => app.listen(port, () => console.log(`listening on port ${port}`)));

app.use('/dist', express.static(path.join(__dirname, 'dist')));

app.use((req, res, next) => {
    if (!req.headers.authorization) {
        return next();
    }
    User.findByToken(req.headers.authorization)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(next);
});

app.get('/api/login', (req, res, next) => {
    const URL = `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}`
    res.redirect(URL)
})

app.get('/github/callback', (req, res, next) => {
    console.log('query => ', req.query.code, process.env.CLIENT_ID)
    axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: req.query.code
    })
        .then(response => response.data)
        .then(data => {
            const { access_token } = qs.parse(data)
            return axios.get('https://api.github.com/user', {
                headers: {
                    authorization: `token ${access_token}`
                }
            })
        })
        .then(response => response.data)
        .then(githubUser => {
            req.session.user = githubUser
            // User.findOne({ where: { githubId: githubUser}})
            //     .then()
            res.redirect('/')
        })
        .catch(next);
})

app.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
