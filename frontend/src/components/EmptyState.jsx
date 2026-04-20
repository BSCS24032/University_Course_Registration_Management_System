const EmptyState = ({ title = 'Nothing to show', message = '' }) => (
    <div className="empty-state">
        <h3>{title}</h3>
        {message && <p>{message}</p>}
    </div>
);

export default EmptyState;
