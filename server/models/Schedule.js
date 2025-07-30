const mongoose = require('mongoose');

const TimeRangeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Free', 'Maybe Free', 'Not Free'],
    required: true
  },
  id: {
    type: Number,
    required: false
  }
});

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