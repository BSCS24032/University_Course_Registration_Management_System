const db = require('../config/db');

exports.listHostels = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM hostel ORDER BY name');
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.listRooms = async (req, res) => {
    const { hostel_id } = req.query;
    try {
        const sql = hostel_id
            ? `SELECT r.*, h.name AS hostel_name FROM hostel_room r JOIN hostel h ON r.hostel_id = h.hostel_id WHERE r.hostel_id = ? ORDER BY r.room_number`
            : `SELECT r.*, h.name AS hostel_name FROM hostel_room r JOIN hostel h ON r.hostel_id = h.hostel_id ORDER BY h.name, r.room_number`;
        const params = hostel_id ? [hostel_id] : [];
        const [rows] = await db.execute(sql, params);
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.listAllocations = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT ha.allocation_id, ha.student_id,
                    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                    r.room_number, h.name AS hostel_name,
                    ha.alloc_date, ha.vacate_date, ha.status
             FROM hostel_allocation ha
             JOIN student s ON ha.student_id = s.student_id
             JOIN hostel_room r ON ha.room_id = r.room_id
             JOIN hostel h ON r.hostel_id = h.hostel_id
             ORDER BY ha.alloc_date DESC`
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

/**
 * ACID Transaction: Allocate a room to a student.
 * Checks capacity, prevents double-allocation, bumps current_occupancy atomically.
 */
exports.allocateRoom = async (req, res) => {
    const { student_id, room_id } = req.body;
    if (!student_id || !room_id) {
        return res.status(400).json({ status: 'error', message: 'student_id and room_id are required.' });
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [rooms] = await conn.execute(
            'SELECT capacity, current_occupancy FROM hostel_room WHERE room_id = ? FOR UPDATE', [room_id]
        );
        if (rooms.length === 0) throw new Error('Room not found.');
        if (rooms[0].current_occupancy >= rooms[0].capacity) throw new Error('Room is at full capacity.');

        const [existing] = await conn.execute(
            "SELECT allocation_id FROM hostel_allocation WHERE student_id = ? AND status = 'Active'",
            [student_id]
        );
        if (existing.length > 0) throw new Error('Student already has an active hostel allocation.');

        await conn.execute(
            'INSERT INTO hostel_allocation (student_id, room_id, alloc_date, status) VALUES (?, ?, CURDATE(), ?)',
            [student_id, room_id, 'Active']
        );
        await conn.execute(
            'UPDATE hostel_room SET current_occupancy = current_occupancy + 1 WHERE room_id = ?', [room_id]
        );

        await conn.commit();
        res.status(201).json({ status: 'success', message: 'Room allocated.' });
    } catch (error) {
        await conn.rollback();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        conn.release();
    }
};

/** Vacate a room — decrements current_occupancy atomically. */
exports.vacateRoom = async (req, res) => {
    const { allocation_id } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(
            'SELECT room_id, status FROM hostel_allocation WHERE allocation_id = ? FOR UPDATE', [allocation_id]
        );
        if (rows.length === 0) throw new Error('Allocation not found.');
        if (rows[0].status !== 'Active') throw new Error(`Cannot vacate: status is '${rows[0].status}'.`);

        await conn.execute(
            "UPDATE hostel_allocation SET vacate_date = CURDATE(), status = 'Vacated' WHERE allocation_id = ?",
            [allocation_id]
        );
        await conn.execute(
            'UPDATE hostel_room SET current_occupancy = current_occupancy - 1 WHERE room_id = ?',
            [rows[0].room_id]
        );
        await conn.commit();
        res.status(200).json({ status: 'success', message: 'Room vacated.' });
    } catch (e) {
        await conn.rollback();
        res.status(400).json({ status: 'error', message: e.message });
    } finally { conn.release(); }
};
