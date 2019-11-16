var express = require('express');
var router = express.Router();

router.use('/user', require('./user'));
router.use('/main', require('./main'));
router.use('/image', require('./image'));

module.exports = router;
