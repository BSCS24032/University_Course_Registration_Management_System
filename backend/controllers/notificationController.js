const db = require('../config/db');

/** GET /notifications — current user's notifications. */
exports.listMyNotifications = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT * FROM notification WHERE user_id = ?
             ORDER BY is_read ASC, created_at DESC
             LIMIT 50`,
            [req.user.id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** GET /notifications/unread-count — for the bell badge. */
exports.getUnreadCount = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS unread FROM notification
             WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );
        res.status(200).json({ status: 'success', data: { unread: rows[0].unread } });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** PATCH /notifications/:id/read */
exports.markRead = async (req, res) => {
    try {
        const [r] = await db.execute(
            `UPDATE notification SET is_read = TRUE
             WHERE notification_id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );
        if (r.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Notification not found.' });
        }
        res.status(200).json({ status: 'success', message: 'Marked read.' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** PATCH /notifications/read-all */
exports.markAllRead = async (req, res) => {
    try {
        await db.execute(
            `UPDATE notification SET is_read = TRUE
             WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );
        res.status(200).json({ status: 'success', message: 'All notifications marked read.' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** DELETE /notifications/:id — clear a single notification. */
exports.deleteNotification = async (req, res) => {
    try {
        await db.execute(
            `DELETE FROM notification WHERE notification_id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );
        res.status(200).json({ status: 'success', message: 'Notification deleted.' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};
