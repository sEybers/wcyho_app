const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Schedule = require('../models/Schedule');

// @route   GET api/schedules
// @desc    Get all schedules for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const schedules = await Schedule.find({ user: req.user.id });
    res.json(schedules);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/schedules
// @desc    Create a schedule
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name } = req.body;

  try {
    // Create empty schedule with all days
    const emptySchedule = {
      Sunday: { timeRanges: [] },
      Monday: { timeRanges: [] },
      Tuesday: { timeRanges: [] },
      Wednesday: { timeRanges: [] },
      Thursday: { timeRanges: [] },
      Friday: { timeRanges: [] },
      Saturday: { timeRanges: [] }
    };

    const newSchedule = new Schedule({
      name,
      user: req.user.id,
      schedule: emptySchedule
    });

    const schedule = await newSchedule.save();
    res.json(schedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/schedules/:id
// @desc    Update a schedule
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, schedule } = req.body;

  try {
    console.log('PUT /api/schedules/:id called with:', {
      id: req.params.id,
      body: req.body,
      userId: req.user.id
    });

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ error: 'Invalid schedule ID format' });
    }

    let scheduleItem = await Schedule.findById(req.params.id);

    if (!scheduleItem) {
      console.log('Schedule not found:', req.params.id);
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Make sure user owns the schedule
    if (scheduleItem.user.toString() !== req.user.id) {
      console.log('Authorization failed - user mismatch:', {
        scheduleUser: scheduleItem.user.toString(),
        requestUser: req.user.id
      });
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Validate and sanitize update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (schedule !== undefined) {
      console.log('Schedule update data:', JSON.stringify(schedule, null, 2));
      updateData.schedule = schedule;
    }
    updateData.lastModified = new Date();

    console.log('Final update data:', JSON.stringify(updateData, null, 2));

    scheduleItem = await Schedule.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log('Successfully updated schedule');
    res.json(scheduleItem);
  } catch (err) {
    console.error('Error updating schedule:', err);
    console.error('Error stack:', err.stack);
    if (err.name === 'ValidationError') {
      console.error('Validation errors:', err.errors);
      return res.status(400).json({ 
        error: 'Invalid schedule data', 
        details: err.message,
        validationErrors: err.errors
      });
    }
    if (err.name === 'CastError') {
      console.error('Cast error:', err);
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// @route   DELETE api/schedules/:id
// @desc    Delete a schedule
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Make sure user owns the schedule
    if (schedule.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await Schedule.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Schedule removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;