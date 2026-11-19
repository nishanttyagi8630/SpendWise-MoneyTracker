// Analytics Routes
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/summary', analyticsController.getSummary);
router.get('/monthly', analyticsController.getMonthlyAnalytics);
router.get('/categories', analyticsController.getCategoryAnalytics);
router.get('/recent', analyticsController.getRecent);
router.get('/financial-health', analyticsController.getFinancialHealthScore);

module.exports = router;
