var express = require('express');
var router = express.Router();

router.use('/', require('./buy'));
module.exports = router;
