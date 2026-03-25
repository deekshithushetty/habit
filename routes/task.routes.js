import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Task } from '../models/index.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/tasks
// @desc    Get all tasks for current user
// @access  Private
router.get('/', [
  query('filter')
    .optional()
    .isIn(['today', 'upcoming', 'completed']).withMessage('Invalid filter'),
  query('category')
    .optional()
    .isIn(['work', 'personal', 'health', 'learning']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const { filter, category } = req.query;
    
    // Build query
    const queryFilter = { userId: req.user._id };
    
    // Apply filter
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      queryFilter.date = { $gte: today, $lt: tomorrow };
    } else if (filter === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      queryFilter.date = { $gt: today };
    } else if (filter === 'completed') {
      queryFilter.completed = true;
    }
    
    // Apply category filter
    if (category) {
      queryFilter.category = category;
    }
    
    const tasks = await Task.find(queryFilter).sort({ date: 1, time: 1 });
    
    res.json({
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('category')
    .optional()
    .isIn(['work', 'personal', 'health', 'learning']).withMessage('Invalid category'),
  body('time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('frequency')
    .optional()
    .isIn(['once', 'daily', 'weekly']).withMessage('Invalid frequency'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }
    
    const { title, category, time, frequency, date } = req.body;
    
    const task = await Task.create({
      userId: req.user._id,
      title,
      category: category || 'personal',
      time: time || null,
      frequency: frequency || 'once',
      date: new Date(date),
      completed: false
    });
    
    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('category')
    .optional()
    .isIn(['work', 'personal', 'health', 'learning']).withMessage('Invalid category'),
  body('time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('frequency')
    .optional()
    .isIn(['once', 'daily', 'weekly']).withMessage('Invalid frequency'),
  body('completed')
    .optional()
    .isBoolean().withMessage('Completed must be true or false'),
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }
    
    const task = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update allowed fields
    const allowedFields = ['title', 'category', 'time', 'frequency', 'completed', 'date'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'date') {
          task[field] = new Date(req.body[field]);
        } else {
          task[field] = req.body[field];
        }
      }
    });
    
    await task.save();
    
    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

export default router;
