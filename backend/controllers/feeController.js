const pool = require('../config/db');

exports.processFeePayment = async (req, res) => {
    const { fee_id, payment_amount } = req.body;

    const connection = await pool.getConnection();

    try {
        console.log(`\n--- STARTING FEE PAYMENT TRANSACTION (Fee ID: ${fee_id}) ---`);

        await connection.beginTransaction();
        console.log('1. Transaction Began');

        const [feeRecords] = await connection.execute(
            'SELECT * FROM fee WHERE fee_id = ? FOR UPDATE',
            [fee_id]
        );

        if (feeRecords.length === 0) {
            throw new Error('Fee voucher not found.');
        }

        const fee = feeRecords[0];

        if (fee.status === 'Paid') {
            throw new Error('This fee voucher is already fully paid.');
        }

        const currentPaid = parseFloat(fee.paid_amount || 0);
        const amountToPay = parseFloat(payment_amount);
        const totalAmount = parseFloat(fee.total_amount);
        
        const newPaidAmount = currentPaid + amountToPay;

        if (newPaidAmount > totalAmount) {
            throw new Error(`Payment exceeds the total amount due. Remaining balance is only ${totalAmount - currentPaid}.`);
        }

        const newStatus = (newPaidAmount === totalAmount) ? 'Paid' : 'Partial';

        console.log(`2. Updating fee record. New Status: ${newStatus}`);
        await connection.execute(
            'UPDATE fee SET paid_amount = ?, payment_date = CURDATE(), status = ? WHERE fee_id = ?',
            [newPaidAmount, newStatus, fee_id]
        );

        await connection.commit();
        console.log('--- TRANSACTION COMMITTED SUCCESSFULLY ---\n');

        res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            data: { fee_id, new_paid_amount: newPaidAmount, status: newStatus }
        });

    } catch (error) {
        await connection.rollback();
        console.log('--- TRANSACTION FAILED & ROLLED BACK ---');
        console.error('Reason:', error.message, '\n');

        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
};

exports.getMyFees = async (req, res) => {
    const student_id = req.user.id;
    try {
        const [fees] = await pool.execute(
            'SELECT * FROM vw_student_fee_summary WHERE student_id = ?',
            [student_id]
        );
        res.status(200).json({ success: true, data: fees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};