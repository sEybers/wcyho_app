const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/friends
// @desc    Get user's friends
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'username email')
      .select('friends');
    
    res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/friends/with-schedules
// @desc    Get user's friends with their primary schedules
// @access  Private
router.get('/with-schedules', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'friends',
        select: 'username email primarySchedule',
        populate: {
          path: 'primarySchedule',
          select: 'name schedule'
        }
      })
      .select('friends');
    
    res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/friends/requests
// @desc    Get pending friend requests
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friendRequests', 'username email _id')
      .populate('sentRequests', 'username email _id')
      .select('friendRequests sentRequests');
    
    res.json({
      received: user.friendRequests,
      sent: user.sentRequests
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/friends/request/:id
// @desc    Send friend request
// @access  Private
router.post('/request/:id', auth, async (req, res) => {
  try {
    // Check if user exists
    const friend = await User.findById(req.params.id);
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Can't send request to yourself
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    // Check if already friends
    const user = await User.findById(req.user.id);
    if (user.friends.includes(req.params.id)) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }

    // Check if request already sent
    if (user.sentRequests.includes(req.params.id)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Add to sent requests for current user
    user.sentRequests.push(req.params.id);
    await user.save();

    // Add to friend requests for target user
    friend.friendRequests.push(req.user.id);
    await friend.save();

    res.json({ msg: 'Friend request sent' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/friends/accept/:id
// @desc    Accept friend request
// @access  Private
router.put('/accept/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);

    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request exists
    if (!user.friendRequests.includes(req.params.id)) {
      return res.status(400).json({ error: 'Friend request not found' });
    }

    // Add to friends list for both users
    user.friends.push(req.params.id);
    friend.friends.push(req.user.id);

    // Remove from requests
    user.friendRequests = user.friendRequests.filter(
      id => id.toString() !== req.params.id
    );
    friend.sentRequests = friend.sentRequests.filter(
      id => id.toString() !== req.user.id
    );

    await user.save();
    await friend.save();

    res.json({ msg: 'Friend request accepted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/friends/reject/:id
// @desc    Reject friend request
// @access  Private
router.delete('/reject/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const sender = await User.findById(req.params.id);

    if (!sender) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from requests
    user.friendRequests = user.friendRequests.filter(
      id => id.toString() !== req.params.id
    );
    sender.sentRequests = sender.sentRequests.filter(
      id => id.toString() !== req.user.id
    );

    await user.save();
    await sender.save();

    res.json({ msg: 'Friend request rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/friends/cancel/:id
// @desc    Cancel sent friend request
// @access  Private
router.delete('/cancel/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipient = await User.findById(req.params.id);

    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from sent requests for current user
    user.sentRequests = user.sentRequests.filter(
      id => id.toString() !== req.params.id
    );
    
    // Remove from friend requests for recipient
    recipient.friendRequests = recipient.friendRequests.filter(
      id => id.toString() !== req.user.id
    );

    await user.save();
    await recipient.save();

    res.json({ msg: 'Friend request cancelled' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/friends/:id
// @desc    Remove friend
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);

    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from friends for both users
    user.friends = user.friends.filter(
      id => id.toString() !== req.params.id
    );
    friend.friends = friend.friends.filter(
      id => id.toString() !== req.user.id
    );

    await user.save();
    await friend.save();

    res.json({ msg: 'Friend removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;