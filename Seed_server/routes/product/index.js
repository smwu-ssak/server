var express = require('express');
var router = express.Router();

router.use('/', require('./product'));
module.exports = router;
