const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
// const auth = require('../middleware/auth'); // Removed for demo mode

// Event routes - now public for demo mode
router.get('/', eventController.getEvents);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;