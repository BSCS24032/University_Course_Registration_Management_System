const pool = require('../config/db');

exports.processFeePayment = async (req, res) => {
    const { fee_id, payment_amount } = req.body;
    
    // 1. Get a dedicated connection for the transaction
    const connection = await pool.getConnection();

    try {
        console.log(`\n--- STARTING FEE PAYMENT TRANSACTION (Fee ID: ${fee_id}) ---`);
        
        // 2. BEGIN TRANSACTION
        await connection.beginTransaction();
        console.log('1. Transaction Began');

        // 3. LOCK THE ROW (FOR UPDATE)
        const [feeRecords] = await connection.execute(
            'SELECT * FROM fee WHERE fee_id = ? FOR UPDATE',
            [fee_id]
        );

        // Check 1: Does the fee exist?
        if (feeRecords.length === 0) {
            throw new Error('Fee voucher not found.');
        }

        const fee = feeRecords[0];
        
        // Check 2: Is it already paid?
        if (fee.status === 'Paid') {
            throw new Error('This fee voucher is already fully paid.');
        }

        // Calculate new amounts
        const currentPaid = parseFloat(fee.paid_amount || 0);
        const amountToPay = parseFloat(payment_amount);
        const totalAmount = parseFloat(fee.total_amount);
        
        const newPaidAmount = currentPaid + amountToPay;

        // Check 3: Prevent overpayment
        if (newPaidAmount > totalAmount) {
            throw new Error(`Payment exceeds the total amount due. Remaining balance is only ${totalAmount - currentPaid}.`);
        }

        // Determine new status
        const newStatus = (newPaidAmount === totalAmount) ? 'Paid' : 'Partial';

        // 4. UPDATE THE DATABASE
        console.log(`2. Updating fee record. New Status: ${newStatus}`);
        await connection.execute(
            'UPDATE fee SET paid_amount = ?, payment_date = CURDATE(), status = ? WHERE fee_id = ?',
            [newPaidAmount, newStatus, fee_id]
        );

        // 5. COMMIT TRANSACTION
        await connection.commit();
        console.log('--- TRANSACTION COMMITTED SUCCESSFULLY ---\n');

        res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            data: { fee_id, new_paid_amount: newPaidAmount, status: newStatus }
        });

    } catch (error) {
        // 6. ROLLBACK ON ANY ERROR
        await connection.rollback();
        console.log('--- TRANSACTION FAILED & ROLLED BACK ---');
        console.error('Reason:', error.message, '\n');

        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        // Always release the connection back to the pool
        connection.release();
    }
};