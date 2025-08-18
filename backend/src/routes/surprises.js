const express = require('express');
const router = express.Router();
const surpriseController = require('../controllers/surprises');
// const auth = require('../middleware/auth'); // Removed for demo mode

// All routes are now public for demo mode
// router.use(auth); // Disabled authentication

// Get all surprises for user and partner
router.get('/', surpriseController.getSurprises);

// Create new surprise
router.post('/', surpriseController.createSurprise);

// Update surprise
router.put('/:id', surpriseController.updateSurprise);

// Delete surprise
router.delete('/:id', surpriseController.deleteSurprise);

module.exports = router;