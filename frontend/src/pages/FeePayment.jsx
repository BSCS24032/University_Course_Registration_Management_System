import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const FeePayment = () => {
    const { user } = useContext(AuthContext);
    const [fees, setFees] = useState([]);
    const [selectedFee, setSelectedFee] = useState(null);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [msg, setMsg]   = useState('');
    const [opErr, setOpErr] = useState('');
    const [busy, setBusy] = useState(false);

    const fetchFees = async () => {
        setLoading(true);
        setError('');
        try {
            const r = await api.get('/fees/my-fees');
            setFees(r.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load fee information.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchFees(); }, []);

    const handlePayment = async (e) => {
        e.preventDefault();
        setMsg(''); setOpErr('');

        if (!selectedFee)     { setOpErr('Please select a fee voucher.'); return; }
        if (!amount || amount <= 0) { setOpErr('Enter a valid payment amount.'); return; }

        const fee = fees.find(f => f.fee_id === selectedFee);
        const balance = Number(fee.total_amount) - Number(fee.paid_amount);
        if (Number(amount) > balance) {
            setOpErr(`Amount exceeds the outstanding balance of PKR ${balance.toLocaleString()}.`);
            return;
        }

        setBusy(true);
        try {
            const r = await api.post('/fees/pay', {
                fee_id: selectedFee,
                payment_amount: Number(amount)
            });
            setMsg(r.data.message || 'Payment recorded.');
            setAmount('');
            setSelectedFee(null);
            fetchFees();
        } catch (err) {
            setOpErr(err.response?.data?.message || 'Payment failed.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchFees} /></Layout>;

    const totalDue = fees.reduce((s, f) => s + (Number(f.total_amount) - Number(f.paid_amount)), 0);

    return (
        <Layout>
            {msg   && <div className="alert alert-success">{msg}</div>}
            {opErr && <div className="alert alert-error">{opErr}</div>}

            <div className="stat-grid">
                <div className="stat-card warning">
                    <div className="label">Outstanding Balance</div>
                    <div className="value">PKR {totalDue.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Fee Vouchers</div>
                    <div className="value">{fees.length}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>My Fee Vouchers</h3></div>
                {fees.length === 0 ? (
                    <EmptyState title="No vouchers issued" />
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Term</th>
                                    <th className="num">Total</th>
                                    <th className="num">Paid</th>
                                    <th className="num">Balance</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.map(f => {
                                    const bal = Number(f.total_amount) - Number(f.paid_amount);
                                    return (
                                        <tr
                                            key={f.fee_id}
                                            style={{
                                                background: selectedFee === f.fee_id ? '#e6edf6' : 'transparent',
                                                cursor: bal > 0 ? 'pointer' : 'default'
                                            }}
                                            onClick={() => bal > 0 && setSelectedFee(f.fee_id)}
                                        >
                                            <td>
                                                {bal > 0 && (
                                                    <input
                                                        type="radio"
                                                        checked={selectedFee === f.fee_id}
                                                        onChange={() => setSelectedFee(f.fee_id)}
                                                    />
                                                )}
                                            </td>
                                            <td>{f.semester} {f.year}</td>
                                            <td className="num">{Number(f.total_amount).toLocaleString()}</td>
                                            <td className="num">{Number(f.paid_amount).toLocaleString()}</td>
                                            <td className="num"><strong>{bal.toLocaleString()}</strong></td>
                                            <td>{f.due_date}</td>
                                            <td>
                                                <span className={`badge badge-${f.status === 'Paid' ? 'success' : f.status === 'Partial' ? 'warning' : 'danger'}`}>
                                                    {f.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedFee && (
                <div className="card">
                    <div className="card-header"><h3>Make Payment</h3></div>
                    <form onSubmit={handlePayment}>
                        <label className="field">
                            <span>Payment amount (PKR)<span className="req">*</span></span>
                            <input
                                type="number"
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={busy}
                            />
                        </label>
                        <button type="submit" disabled={busy}>
                            {busy ? 'Processing...' : 'Pay Now'}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            style={{ marginLeft: 10 }}
                            onClick={() => { setSelectedFee(null); setAmount(''); }}
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}
        </Layout>
    );
};

export default FeePayment;
