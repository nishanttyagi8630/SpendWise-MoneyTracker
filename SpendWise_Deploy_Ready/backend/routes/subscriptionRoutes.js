// Subscription Routes
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', subscriptionController.getSubscriptions);
router.post('/', subscriptionController.createSubscription);
router.put('/:id', subscriptionController.updateSubscription);
router.patch('/:id/status', subscriptionController.toggleStatus);
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;
