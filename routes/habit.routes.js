import express from 'express';
import { body, validationResult } from 'express-validator';
import { Habit } from '../models/index.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/habits
// @desc    Get all habits for current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      count: habits.length,
      habits
    });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ message: 'Failed to fetch habits' });
  }
});

// @route   POST /api/habits
// @desc    Create a new habit
// @access  Private
router.post('/', [
  body('name')
    .trim()
    .notEmpty().withMessage('Habit name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('target')
    .notEmpty().withMessage('Target is required')
    .isInt({ min: 1, max: 365 }).withMessage('Target must be 1-365'),
  body('icon')
    .optional()
    .isLength({ max: 10 }).withMessage('Icon must be max 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }
    
    const { name, target, icon } = req.body;
    
    const habit = await Habit.create({
      userId: req.user._id,
      name,
      target,
      icon: icon || '✨',
      progress: 0,
      streak: 0
    });
    
    res.status(201).json({
      message: 'Habit created successfully',
      habit
    });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ message: 'Failed to create habit' });
  }
});

// @route   PUT /api/habits/:id
// @desc    Update a habit (log progress)
// @access  Private
router.put('/:id', [
  body('progress')
    .optional()
    .isInt({ min: 0, max: 365 }).withMessage('Progress must be 0-365'),
  body('increment')
    .optional()
    .isBoolean().withMessage('Increment must be true or false')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }
    
    const habit = await Habit.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    // Handle increment action
    if (req.body.increment === true) {
      habit.progress += 1;
      habit.updateStreak();
    } else if (req.body.increment === false && habit.progress > 0) {
      habit.progress -= 1;
    }
    
    // Handle direct progress update
    if (req.body.progress !== undefined) {
      habit.progress = req.body.progress;
    }
    
    await habit.save();
    
    res.json({
      message: 'Habit updated successfully',
      habit
    });
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ message: 'Failed to update habit' });
  }
});

// @route   DELETE /api/habits/:id
// @desc    Delete a habit
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ message: 'Failed to delete habit' });
  }
});

// @route   POST /api/habits/:id/reset-streak
// @desc    Reset a habit's streak
// @access  Private
router.post('/:id/reset-streak', async (req, res) => {
  try {
    const habit = await Habit.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    habit.streak = 0;
    habit.lastCompleted = null;
    await habit.save();
    
    res.json({
      message: 'Streak reset successfully',
      habit
    });
  } catch (error) {
    console.error('Reset streak error:', error);
    res.status(500).json({ message: 'Failed to reset streak' });
  }
});

export default router;
