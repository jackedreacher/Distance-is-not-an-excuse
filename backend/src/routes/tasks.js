const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
// const auth = require('../middleware/auth'); // Removed for demo mode

// Task routes - now public for demo mode
router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;