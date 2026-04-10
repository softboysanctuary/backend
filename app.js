require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path'); 
const cors = require('cors');
const SqliteStore = require('better-sqlite3-session-store')(session);
const db = require('./database/db');

require('./config/passport');

const app = express();

app.get('/health', (req, res) => {
    res.status(200).send('OK'); 
});

app.use(cors({
    origin: true, 
    credentials: true 
}));

app.use(express.json());

const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1); 
app.use(session({
    store: new SqliteStore({ client: db }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        domain: '.softboy.site', 
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax'
    } 
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));
app.use('/api', require('./routes/reviews'));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Backend live on http://localhost:${PORT}`));
