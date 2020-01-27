var express = require('express');
var router = express.Router();

router.use('/', require('./gps'));

module.exports = router;
