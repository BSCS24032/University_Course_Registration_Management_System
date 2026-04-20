const Loading = ({ message = 'Loading...' }) => (
    <div className="loading">
        <div className="spinner" />
        <div>{message}</div>
    </div>
);

export default Loading;
