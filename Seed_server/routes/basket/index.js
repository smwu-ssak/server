var express = require('express');
var router = express.Router();

router.use('/', require('./basket'));
module.exports = router;
