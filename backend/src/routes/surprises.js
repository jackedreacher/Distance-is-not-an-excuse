const express = require('express');
const router = express.Router();
const surpriseController = require('../controllers/surprises');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all surprises for user and partner
router.get('/', surpriseController.getSurprises);

// Create new surprise
router.post('/', surpriseController.createSurprise);

// Update surprise
router.put('/:id', surpriseController.updateSurprise);

// Delete surprise
router.delete('/:id', surpriseController.deleteSurprise);

module.exports = router;