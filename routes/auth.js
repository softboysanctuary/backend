const router = require('express').Router();
const passport = require('passport');
const db = require('../database/db'); 
const { isAuthenticated, getAvatar } = require('../utils/discord');

// Starts the Discord OAuth login flow
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', (req, res, next) => {
  // Handle OAuth callback manually so we can control the response window
  passport.authenticate('discord', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.send('<script>window.close();</script>'); // Close popup if auth failed

    // Establish login session
    req.logIn(user, (err) => {
      if (err) return next(err);

      res.send(`
        <html>
          <body style="background: #020617; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
            <div style="text-align: center;">
              <p>Authentication Successful!</p>
              <p style="font-size: 12px; color: #64748b;">Closing window...</p>
            </div>
            <script>
            if (window.opener) {
                try {
                window.opener.location.reload();
                } catch (e) {
                console.error("Failed to refresh main window", e);
                }
            }
            setTimeout(() => {
                window.close();
            }, 100);
            </script>
          </body>
        </html>
      `);
    });
  })(req, res, next);
});

// Logs the user out and destroys the session
router.get('/logout', (req, res) => {
    req.logout(() => res.redirect('https://softboy.site/'));
});

// Returns the currently logged-in user
router.get('/me', (req, res) => {
    res.send(req.user || { loggedIn: false });
});

// Returns the 10 most recently logged-in members
// Kind of think about making those like "Recently viewed" forum thingies lol
router.get('/members', isAuthenticated, (req, res) => {
    try {
        const members = db.prepare(`
            SELECT username, discord_id, avatar, last_login 
            FROM users 
            ORDER BY last_login DESC 
            LIMIT 10
        `).all();

        const formatted = members.map(m => ({
            ...m,
            avatar_url: getAvatar(m.discord_id, m.avatar)
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch members" });
    }
});

module.exports = router;