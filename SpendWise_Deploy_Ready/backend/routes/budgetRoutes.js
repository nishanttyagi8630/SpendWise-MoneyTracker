// Budget Routes
const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', budgetController.getBudgets);
router.post('/', budgetController.createOrUpdateBudget);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
