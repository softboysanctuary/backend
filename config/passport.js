const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const axios = require('axios');
const db = require('../database/db');

// Store only the Discord ID in the session
passport.serializeUser((user, done) => {
    done(null, user.id || user.discord_id);
});

// Retrieve the user from the database using the stored Discord ID
passport.deserializeUser((id, done) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE discord_id = ?').get(id);
        if (!user) return done(null, null);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ['identify', 'guilds.join'] // identify = basic profile, guilds.join = allow bot to add user to server
}, async (accessToken, refreshToken, profile, done) => {
    
    try {
        // Insert user or update existing record on login
        const upsert = db.prepare(`
            INSERT INTO users (discord_id, username, avatar)
            VALUES (?, ?, ?)
            ON CONFLICT(discord_id) DO UPDATE SET 
                username = excluded.username,
                avatar = excluded.avatar,
                last_login = CURRENT_TIMESTAMP
        `);
        upsert.run(profile.id, profile.username, profile.avatar);
    } catch (dbError) {
        console.error("Database Error:", dbError);
    }

    try {
        // Attempt to add the user to the Discord server
        await axios.put(
            `https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${profile.id}`,
            { access_token: accessToken },
            {
                headers: {
                    Authorization: `Bot ${process.env.BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`Successfully synced ${profile.username} with the server!`);
    } catch (error) {
        // 204 means the user is already in the server
        if (error.response && error.response.status === 204) {
            console.log(`${profile.username} is already a member.`);
        } else {
            console.log("Error joining server:", error.response?.data || error.message);
        }
    }

    return done(null, profile);
}));