var express = require('express');
var router = express.Router();

router.use('/', require('./store'));

module.exports = router;
