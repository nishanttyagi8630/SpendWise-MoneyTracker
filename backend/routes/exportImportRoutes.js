// Export / Import Routes
const express = require('express');
const router = express.Router();
const exportImportController = require('../controllers/exportImportController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/export/csv', exportImportController.exportCSV);
router.post('/import/csv', exportImportController.importCSV);

module.exports = router;
