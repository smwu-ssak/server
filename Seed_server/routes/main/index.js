var express = require('express');
var router = express.Router();

router.use('/', require('./main'));
router.use('/seller', require('./seller'));

module.exports = router;
