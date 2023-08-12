const express = require('express');
const router = express.Router();
const { emailConfirmation } = require('../controllers/customerConfirmation');

router.get('/emailconfirmation', emailConfirmation);
module.exports = router;
