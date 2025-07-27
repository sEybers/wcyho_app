import React, { useState } from 'react';
import FriendRequests from '../components/FriendRequests/FriendRequests';
import '../css/Friends.css';

function Friends({ userId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('username'); // or 'email'
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  // Mock function to simulate searching users
  const handleSearch = (e) => {
    e.preventDefault();
    // This would typically be an API call to your backend
    const mockResults = [
      { id: 1, username: 'john_doe', email: 'john@example.com' },
      { id: 2, username: 'jane_smith', email: 'jane@example.com' },
    ];
    setSearchResults(mockResults.filter(user => 
      !friends.find(friend => friend.id === user.id) &&
      !sentRequests.find(request => request.id === user.id)
    ));
  };

  const handleSendRequest = (user) => {
    // This would typically be an API call
    setSentRequests([...sentRequests, user]);
    setSearchResults(searchResults.filter(result => result.id !== user.id));
  };

  const handleAcceptRequest = (requestId) => {
    const request = friendRequests.find(req => req.id === requestId);
    if (request) {
      setFriends([...friends, request]);
      setFriendRequests(friendRequests.filter(req => req.id !== requestId));
    }
  };

  const handleRejectRequest = (requestId) => {
    setFriendRequests(friendRequests.filter(req => req.id !== requestId));
  };

  const handleCancelRequest = (userId) => {
    setSentRequests(sentRequests.filter(request => request.id !== userId));
  };

  const handleRemoveFriend = (userId) => {
    setFriends(friends.filter(friend => friend.id !== userId));
  };

  return (
    <div className="friends-container">
      <h1>Friends</h1>
      
      <FriendRequests 
        requests={friendRequests}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
      />

      {/* Search Section */}
      <div className="search-section">
        <form onSubmit={handleSearch}>
          <select 
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="search-type"
          >
            <option value="username">Username</option>
            <option value="email">Email</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by ${searchType}...`}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h2>Search Results</h2>
          <div className="results-list">
            {searchResults.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <p className="username">{user.username}</p>
                  <p className="email">{user.email}</p>
                </div>
                <button 
                  onClick={() => handleSendRequest(user)}
                  className="add-friend-button"
                >
                  Send Request
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className="sent-requests">
          <h2>Sent Requests</h2>
          <div className="requests-list">
            {sentRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-info">
                  <p className="username">{request.username}</p>
                  <p className="email">{request.email}</p>
                </div>
                <button 
                  onClick={() => handleCancelRequest(request.id)}
                  className="cancel-request-button"
                >
                  Cancel Request
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="friends-list">
        <h2>My Friends</h2>
        {friends.length === 0 ? (
          <p>You haven't added any friends yet.</p>
        ) : (
          <div className="friends-grid">
            {friends.map(friend => (
              <div key={friend.id} className="friend-card">
                <div className="friend-info">
                  <p className="username">{friend.username}</p>
                  <p className="email">{friend.email}</p>
                </div>
                <button 
                  onClick={() => handleRemoveFriend(friend.id)}
                  className="remove-friend-button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;