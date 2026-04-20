const ErrorMessage = ({ message, onRetry }) => (
    <div className="alert alert-error">
        <strong>Something went wrong.</strong>
        <div style={{ marginTop: 4 }}>{message || 'An unexpected error occurred.'}</div>
        {onRetry && (
            <button
                className="btn-secondary btn-sm"
                style={{ marginTop: 8 }}
                onClick={onRetry}
            >
                Try again
            </button>
        )}
    </div>
);

export default ErrorMessage;
