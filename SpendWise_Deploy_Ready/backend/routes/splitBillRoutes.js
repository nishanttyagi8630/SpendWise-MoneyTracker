// Split Bill Routes
const express = require('express');
const router = express.Router();
const splitBillController = require('../controllers/splitBillController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', splitBillController.getSplitBills);
router.post('/', splitBillController.createSplitBill);
router.patch('/:id/settle-participant', splitBillController.settleParticipant);
router.delete('/:id', splitBillController.deleteSplitBill);

module.exports = router;
