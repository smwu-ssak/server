var express = require('express');
var router = express.Router();

router.use('/user', require('./user'));
router.use('/main', require('./main'));
router.use('/image', require('./image'));
router.use('/store', require('./store'));
router.use('/mypage', require('./mypage'));
router.use('/product', require('./product'));



module.exports = router;
