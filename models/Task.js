import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [1, 'Task title cannot be empty'],
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  category: {
    type: String,
    enum: {
      values: ['work', 'personal', 'health', 'learning'],
      message: 'Invalid category. Must be: work, personal, health, or learning'
    },
    default: 'personal'
  },
  time: {
    type: String,
    default: null,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time (HH:MM)']
  },
  frequency: {
    type: String,
    enum: {
      values: ['once', 'daily', 'weekly'],
      message: 'Invalid frequency. Must be: once, daily, or weekly'
    },
    default: 'once'
  },
  completed: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    required: [true, 'Task date is required'],
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
taskSchema.index({ userId: 1, date: 1, completed: 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (this.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(this.date) < today;
});

// Include virtuals in JSON output
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;
