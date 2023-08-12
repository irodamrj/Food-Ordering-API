const express = require('express');
const router = express.Router();
const { emailConfirmation } = require('../controllers/cookerConfirmation');

router.get('/emailconfirmation', emailConfirmation);
module.exports = router;
