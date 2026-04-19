import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const FeePayment = () => {
    const { user } = useContext(AuthContext);
    const [fees, setFees] = useState([]);
    const [amount, setAmount] = useState('');
    const [selectedFee, setSelectedFee] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const response = await api.get('/fees/my-fees');
            setFees(response.data.data);
        } catch (err) {
            setError('Could not load fee information.');
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!selectedFee || !amount) {
            setError('Please select a fee record and enter an amount.');
            return;
        }

        try {
            const response = await api.post('/fees/pay', {
                fee_id: selectedFee,
                payment_amount: amount
            });
            setMessage(response.data.message);
            setAmount('');
            fetchFees(); // Refresh the list after payment
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed');
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>💳 Fee Payment Portal</h2>

            {message && <div style={{ color: 'green', backgroundColor: '#e6ffed', padding: '10px', marginBottom: '10px' }}>{message}</div>}
            {error && <div style={{ color: 'red', backgroundColor: '#ffe6e6', padding: '10px', marginBottom: '10px' }}>{error}</div>}

            <div style={{ marginBottom: '30px' }}>
                <h3>Outstanding Fees</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Semester</th>
                            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Total</th>
                            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Paid</th>
                            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Balance</th>
                            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Status</th>
                            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Select</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fees.map((f) => (
                            <tr key={f.student_id + f.semester}>
                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{f.semester} {f.year}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>${f.total_amount}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>${f.paid_amount}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold' }}>${f.balance_due}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{f.payment_status}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                                    {f.payment_status !== 'Paid' && (
                                        <input 
                                            type="radio" 
                                            name="feeSelect" 
                                            onChange={() => setSelectedFee(f.fee_id)}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedFee && (
                <form onSubmit={handlePayment} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                    <h4>Make a Payment</h4>
                    <input 
                        type="number" 
                        placeholder="Enter Amount" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        style={{ padding: '10px', marginRight: '10px', width: '200px' }}
                    />
                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Confirm Payment
                    </button>
                </form>
            )}
        </div>
    );
};

export default FeePayment;