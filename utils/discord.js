const DISCORD_API_URL = 'https://discord.com/api/v10';

const DiscordUtil = {
    /**
     * Builds a full Discord avatar URL
     */
    getAvatar: (userId, avatarHash, size = 128) => {
        if (!avatarHash) return `https://cdn.discordapp.com/embed/avatars/${userId % 5}.png`;
        const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
        return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=${size}`;
    },

    /**
     * Middleware to protect routes - checks if user is logged in
     */
    isAuthenticated: (req, res, next) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ error: 'Unauthorized: Please login via Discord' });
    },

    /**
     * Simple wrapper for Discord API calls using the user's access token
     * Useful for fetching guilds, connections, etc.
     */
    fetchAPI: async (endpoint, accessToken) => {
        const response = await fetch(`${DISCORD_API_URL}${endpoint}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) throw new Error(`Discord API Error: ${response.statusText}`);
        return response.json();
    }
};

module.exports = DiscordUtil;