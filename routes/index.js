const express = require('express');
const router = express.Router();

router.use('/users', require('./userRoutes'));
router.use('/notes', require('./noteRoutes'));

module.exports = router;
