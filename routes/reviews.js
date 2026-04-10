const router = require('express').Router();
const db = require('../database/db');
const crypto = require('crypto');

// Get who owns the review
const getReviewOwner = (id) => db.prepare('SELECT user_id FROM reviews WHERE id = ?').get(id);

// Post a review
router.post('/reviews', (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Login required" });

    const { content, rating, anonymous } = req.body;
    
    try {
        const insert = db.prepare(`
            INSERT INTO reviews (user_id, content, rating, is_anonymous) 
            VALUES (?, ?, ?, ?)
        `);
        insert.run(req.user.discord_id, content, rating, anonymous ? 1 : 0);
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: "You have already submitted a review!" });
        }
        res.status(500).json({ error: "Database error" });
    }
});

// Get all reviews
router.get('/reviews', (req, res) => {
    const reviews = db.prepare(`
        SELECT r.*, u.username, u.avatar 
        FROM reviews r
        JOIN users u ON r.user_id = u.discord_id
        ORDER BY r.created_at DESC
    `).all();

    const formattedReviews = reviews.map(rev => {
        const isOwner = req.user?.discord_id === rev.user_id;
        
        if (rev.is_anonymous) {
            const hash = crypto.createHash('md5').update(rev.user_id).digest('hex').substring(0, 4);
            return {
                ...rev,
                username: `Anonymous ${hash}`,
                avatar: null,
                user_id: isOwner ? rev.user_id : null,
                is_owner: isOwner
            };
        }
        return { ...rev, is_owner: isOwner };
    });

    res.json(formattedReviews);
});

// Edit a review
router.put('/reviews/:id', (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Login required" });

    const { content, rating, anonymous } = req.body;
    const review = getReviewOwner(req.params.id);

    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.user_id !== req.user.discord_id) return res.status(403).json({ error: "Unauthorized" });

    try {
        db.prepare(`
            UPDATE reviews 
            SET content = ?, rating = ?, is_anonymous = ?, created_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(content, rating, anonymous ? 1 : 0, req.params.id);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to update review" });
    }
});

// Delete a review
router.delete('/reviews/:id', (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Login required" });

    const review = getReviewOwner(req.params.id);

    if (!review) return res.status(404).json({ error: "Review not found" });
    
    if (review.user_id !== req.user.discord_id) {
        return res.status(403).json({ error: "You can only delete your own reviews" });
    }

    try {
        db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete review" });
    }
});

module.exports = router;