const pool = require('../config/db');

exports.processFeePayment = async (req, res) => {
    const { fee_id, payment_amount } = req.body;

    if (!fee_id || !payment_amount || payment_amount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Valid fee_id and positive payment_amount are required.' });
    }

    const connection = await pool.getConnection();

    try {
        console.log(`\n--- STARTING FEE PAYMENT TRANSACTION (Fee ID: ${fee_id}) ---`);
        
        await connection.beginTransaction();
        console.log('1. Transaction Began');

        // Lock the fee row
        const [feeRecords] = await connection.execute(
            'SELECT * FROM fee WHERE fee_id = ? FOR UPDATE',
            [fee_id]
        );

        if (feeRecords.length === 0) {
            throw new Error('Fee voucher not found.');
        }

        const fee = feeRecords[0];

        // Ownership check: Students can only pay their own fees
        if (req.user.role === 'Student') {
            const linkedId = req.user.linked_id;
            if (!linkedId || linkedId !== fee.student_id) {
                throw new Error('Students can only pay their own fees.');
            }
        }

        if (fee.status === 'Paid') {
            throw new Error('This fee voucher is already fully paid.');
        }

        // Use integer arithmetic (paisa) to avoid float equality bugs
        const currentPaid = Math.round(parseFloat(fee.paid_amount) * 100);
        const amountToPay = Math.round(parseFloat(payment_amount) * 100);
        const totalAmount = Math.round(parseFloat(fee.total_amount) * 100);
        const newPaidAmount = currentPaid + amountToPay;

        if (newPaidAmount > totalAmount) {
            const remaining = ((totalAmount - currentPaid) / 100).toFixed(2);
            throw new Error(`Payment exceeds the total amount due. Remaining balance is only ${remaining}.`);
        }

        // Safe equality comparison using integers
        const newStatus = (newPaidAmount === totalAmount) ? 'Paid' : 'Partial';
        const newPaidDecimal = (newPaidAmount / 100).toFixed(2);

        console.log(`2. Updating fee record. New Status: ${newStatus}`);
        await connection.execute(
            'UPDATE fee SET paid_amount = ?, payment_date = CURDATE(), status = ? WHERE fee_id = ?',
            [newPaidDecimal, newStatus, fee_id]
        );

        await connection.commit();
        console.log('--- TRANSACTION COMMITTED SUCCESSFULLY ---\n');

        res.status(200).json({
            status: 'success',
            message: 'Payment processed successfully.',
            data: { fee_id, new_paid_amount: parseFloat(newPaidDecimal), status: newStatus }
        });

    } catch (error) {
        await connection.rollback();
        console.log('--- TRANSACTION FAILED & ROLLED BACK ---');
        console.error('Reason:', error.message, '\n');

        res.status(400).json({
            status: 'error',
            message: error.message
        });
    } finally {
        connection.release();
    }
};

exports.getMyFees = async (req, res) => {
    const student_id = req.user.linked_id;

    if (!student_id) {
        return res.status(400).json({ status: 'error', message: 'No linked student profile found for this account.' });
    }

    try {
        const [fees] = await pool.execute(
            `SELECT f.fee_id, f.student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                    f.semester, f.year, f.total_amount, f.paid_amount,
                    (f.total_amount - f.paid_amount) AS balance_due,
                    f.status AS payment_status, f.due_date
             FROM fee f
             JOIN student s ON f.student_id = s.student_id
             WHERE f.student_id = ?`,
            [student_id]
        );
        res.status(200).json({ status: 'success', data: fees });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
