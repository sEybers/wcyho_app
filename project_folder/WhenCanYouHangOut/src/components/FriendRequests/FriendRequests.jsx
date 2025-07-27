import React from 'react';
import '../../css/FriendRequests.css';

const FriendRequests = ({ requests, onAccept, onReject }) => {
    return (
        <div className="friend-requests">
            <h2>Friend Requests</h2>
            {requests.length === 0 ? (
                <p className="no-requests">No pending friend requests</p>
            ) : (
                <div className="requests-list">
                    {requests.map(request => (
                        <div key={request.id} className="request-card">
                            <div className="request-info">
                                <p className="username">{request.username}</p>
                                <p className="email">{request.email}</p>
                            </div>
                            <div className="request-actions">
                                <button 
                                    onClick={() => onAccept(request.id)}
                                    className="accept-btn"
                                >
                                    Accept
                                </button>
                                <button 
                                    onClick={() => onReject(request.id)}
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