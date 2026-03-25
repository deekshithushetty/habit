import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Habit name is required'],
    trim: true,
    minlength: [1, 'Habit name cannot be empty'],
    maxlength: [100, 'Habit name cannot exceed 100 characters']
  },
  icon: {
    type: String,
    default: '✨'
  },
  progress: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be negative'],
    max: [365, 'Progress cannot exceed 365']
  },
  target: {
    type: Number,
    required: [true, 'Target is required'],
    min: [1, 'Target must be at least 1'],
    max: [365, 'Target cannot exceed 365']
  },
  streak: {
    type: Number,
    default: 0,
    min: [0, 'Streak cannot be negative']
  },
  lastCompleted: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Calculate streak when progress is updated
habitSchema.methods.updateStreak = function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!this.lastCompleted) {
    // First time completing
    this.streak = 1;
    this.lastCompleted = now;
    return;
  }
  
  const lastDate = new Date(this.lastCompleted);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  
  const diffTime = today - lastDay;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Same day, don't change streak
    return;
  } else if (diffDays === 1) {
    // Consecutive day
    this.streak += 1;
    this.lastCompleted = now;
  } else {
    // Streak broken, start new
    this.streak = 1;
    this.lastCompleted = now;
  }
};

// Check if habit target is met
habitSchema.virtual('isTargetMet').get(function() {
  return this.progress >= this.target;
});

// Include virtuals in JSON output
habitSchema.set('toJSON', { virtuals: true });
habitSchema.set('toObject', { virtuals: true });

const Habit = mongoose.model('Habit', habitSchema);

export default Habit;
