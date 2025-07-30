import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiService } from '../services/api.js';
import FriendRequests from '../components/FriendRequests/FriendRequests';
import '../css/Friends.css';

function Friends() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('username'); // or 'email'
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load initial data
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const friendsData = await apiService.getFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
      setError('Failed to load friends');
    }
  };

  const loadFriendRequests = async () => {
    try {
      const requestsData = await apiService.getFriendRequests();
      setFriendRequests(requestsData.received);
      setSentRequests(requestsData.sent);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setError('Failed to load friend requests');
    }
  };

  // Enhanced search with API
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError('');
      
      const users = await apiService.searchUsers(searchQuery, searchType);
      
      // Filter out current user, friends, and sent requests
      const filteredUsers = users.filter(user => 
        !friends.find(friend => friend._id === user._id) &&
        !sentRequests.find(request => request._id === user._id)
      );
      
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (user) => {
    try {
      setError('');
      await apiService.sendFriendRequest(user._id);
      
      // Move user from search results to sent requests
      setSentRequests([...sentRequests, user]);
      setSearchResults(searchResults.filter(result => result._id !== user._id));
      
      // Show success message briefly
      const successMsg = `Friend request sent to ${user.username}!`;
      setError(successMsg);
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError(error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setError('');
      await apiService.acceptFriendRequest(requestId);
      
      // Move from friend requests to friends
      const request = friendRequests.find(req => req._id === requestId);
      if (request) {
        setFriends([...friends, request]);
        setFriendRequests(friendRequests.filter(req => req._id !== requestId));
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setError('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setError('');
      await apiService.rejectFriendRequest(requestId);
      setFriendRequests(friendRequests.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      setError('Failed to reject friend request');
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      setError('');
      await apiService.cancelFriendRequest(userId);
      setSentRequests(sentRequests.filter(request => request._id !== userId));
    } catch (error) {
      console.error('Error canceling friend request:', error);
      setError('Failed to cancel friend request');
    }
  };

  const handleRemoveFriend = async (userId) => {
    try {
      setError('');
      await apiService.removeFriend(userId);
      setFriends(friends.filter(friend => friend._id !== userId));
    } catch (error) {
      console.error('Error removing friend:', error);
      setError('Failed to remove friend');
    }
  };

  return (
    <div className="friends-container">
      <h1>Friends</h1>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}
      
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
            minLength={2}
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h2>Search Results</h2>
          <div className="results-list">
            {searchResults.map(user => (
              <div key={user._id} className="user-card">
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
              <div key={request._id} className="request-card">
                <div className="request-info">
                  <p className="username">{request.username}</p>
                  <p className="email">{request.email}</p>
                </div>
                <button 
                  onClick={() => handleCancelRequest(request._id)}
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
        <h2>My Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p>You haven't added any friends yet. Use the search above to find and add friends!</p>
        ) : (
          <div className="friends-grid">
            {friends.map(friend => (
              <div key={friend._id} className="friend-card">
                <div className="friend-info">
                  <p className="username">{friend.username}</p>
                  <p className="email">{friend.email}</p>
                </div>
                <button 
                  onClick={() => handleRemoveFriend(friend._id)}
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