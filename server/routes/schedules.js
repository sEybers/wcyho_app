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
    let scheduleItem = await Schedule.findById(req.params.id);

    if (!scheduleItem) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Make sure user owns the schedule
    if (scheduleItem.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    scheduleItem = await Schedule.findByIdAndUpdate(
      req.params.id,
      { $set: { name, schedule } },
      { new: true }
    );

    res.json(scheduleItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
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