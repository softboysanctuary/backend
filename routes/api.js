const router = require('express').Router();

// Cache to avoid hitting the Discord API every request
// Functions
let statsCache = null;
let leaderboardCache = {}; 
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minute cache to avoid Discord rate limits
const CACHE_DURATION = 10 * 60 * 1000; // Don't spam the crap out of APIs, They dislike it.

router.get('/stats', async (req, res) => {
    const GUILD_ID = '1443615278608027688';
    const currentTime = Date.now();

    // Return cached stats if still valid
    if (statsCache && (currentTime - lastFetchTime < CACHE_DURATION)) {
        return res.json(statsCache);
    }

    const headers = {
        'Authorization': `Bot ${process.env.BOT_TOKEN}`, // Bot token from env
        'Content-Type': 'application/json'
    };

    try {
        // Fetch guild info and bans at the same time
        const [guildRes, bansRes] = await Promise.all([
            fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`, { headers }),
            fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/bans`, { headers })
        ]);

        if (!guildRes.ok) {
            const errorData = await guildRes.json();
            console.error('Discord API Error:', errorData);
            
            // Fallback to cache if API fails
            if (statsCache) return res.json(statsCache);
            
            return res.status(guildRes.status).json({ error: 'Failed to fetch guild data' });
        }

        const guildData = await guildRes.json();
        const bansData = bansRes.ok ? await bansRes.json() : [];

        const newStats = {
            totalMembers: guildData.approximate_member_count || 0,
            onlineMembers: guildData.approximate_presence_count || 0,
            totalBans: Array.isArray(bansData) ? bansData.length : 0,
            boosts: guildData.premium_subscription_count || 0,
            boostTier: guildData.premium_tier || 0,
            vanityUrl: guildData.vanity_url_code ? `discord.gg/${guildData.vanity_url_code}` : null,
            cachedAt: new Date().toISOString() // Timestamp of when stats were fetched
        };

        // Update cache
        statsCache = newStats;
        lastFetchTime = currentTime;

        res.json(newStats);

    } catch (err) {
        console.error('Server Error:', err);

        // Return cache if available
        if (statsCache) return res.json(statsCache);

        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/leaderboard', async (req, res) => {
    const GUILD_ID = '1443615278608027688';
    const currentTime = Date.now();
    
    if (leaderboardCache[page] && (currentTime - leaderboardCache[page].time < CACHE_DURATION)) {
        console.log(`Serving Page ${page} from cache`);
        return res.json(leaderboardCache[page].data);
    }
    try {
        const response = await fetch(`https://api.lurkr.gg/v2/levels/${GUILD_ID}?page=${page}`, {
            method: 'GET',
            headers: {
                'X-API-Key': process.env.LURKR_API_KEY,
                'Content-Type': 'application/json'
            }

        if (!response.ok) {
            if (leaderboardCache[page]) return res.json(leaderboardCache[page].data);
            return res.status(response.status).json({ error: 'Lurkr API unreachable' });
        }

        const data = await response.json();
            username: player.user?.username || 'Unknown',
            discriminator: player.user?.discriminator || '0000',
            avatar: player.user?.avatar || null,
            level: player.level,
            xp: player.xp,
            rank: player.rank
        }));

        leaderboardCache[page] = {
            data: formattedLeaderboard,
            time: currentTime

        res.json(formattedLeaderboard);

    } catch (err) {
        console.error('Lurkr Fetch Error:', err);
        if (leaderboardCache[page]) return res.json(leaderboardCache[page].data);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;