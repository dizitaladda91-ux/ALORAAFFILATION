const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/links', affiliateController.getLinks);
router.post('/links', affiliateController.createLink);
router.get('/earnings', affiliateController.getEarnings);

module.exports = router;
