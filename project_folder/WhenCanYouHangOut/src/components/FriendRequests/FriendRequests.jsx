import React from 'react';
import '../../css/FriendRequests.css';

const FriendRequests = ({ requests, onAccept, onReject }) => {
    return (
        <div className="friend-requests">
            <h2>Friend Requests ({requests.length})</h2>
            {requests.length === 0 ? (
                <p className="no-requests">No pending friend requests</p>
            ) : (
                <div className="requests-list">
                    {requests.map(request => (
                        <div key={request._id} className="request-card">
                            <div className="request-info">
                                <p className="username">{request.username}</p>
                                <p className="email">{request.email}</p>
                            </div>
                            <div className="request-actions">
                                <button 
                                    onClick={() => onAccept(request._id)}
                                    className="accept-btn"
                                >
                                    Accept
                                </button>
                                <button 
                                    onClick={() => onReject(request._id)}
                                    className="reject-btn"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendRequests;