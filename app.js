require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path'); 
const SqliteStore = require('better-sqlite3-session-store')(session);
const db = require('./database/db');

require('./config/passport');

const app = express();

app.use(express.json());

app.use(session({
    store: new SqliteStore({ client: db }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true 
    } 
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend live on http://localhost:${PORT}`));