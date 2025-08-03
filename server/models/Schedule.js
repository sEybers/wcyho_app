const mongoose = require('mongoose');

const TimeRangeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  start: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{2}:\d{2}$/.test(v);
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  end: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{2}:\d{2}$/.test(v);
      },
      message: 'End time must be in HH:MM format'
    }
  },
  status: {
    type: String,
    enum: ['Free', 'Maybe Free', 'Not Free'],
    required: true
  }
  // Remove the id field since it's causing issues and not needed
}, { _id: true }); // Let MongoDB auto-generate _id for each time range

const DaySchema = new mongoose.Schema({
  timeRanges: [TimeRangeSchema]
});

const ScheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: {
    Sunday: DaySchema,
    Monday: DaySchema,
    Tuesday: DaySchema,
    Wednesday: DaySchema,
    Thursday: DaySchema,
    Friday: DaySchema,
    Saturday: DaySchema
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);