var express = require('express');
var router = express.Router();

router.use('/user', require('./user/index'));
router.use('/main', require('./main/index'));
router.use('/image', require('./image/index'));
router.use('/store', require('./store/index'));
router.use('/mypage', require('./mypage/index'));
router.use('/product', require('./product/index'));
router.use('/basket', require('./basket/index'));
router.use('/buy', require('./buy/index'));

router.get('/', function(req, res, next) {
    res.render('index.html');
});




module.exports = router;
