var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const utils = require('../../module/utils/utils');
const upload = require('../../config/multer');

const pool = require('../../module/pool');
const time = require('../../module/timeFormat');

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.get('/', async (req, res) => {
    const selectMain =
        `
        SELECT p.name proName, p.quantity, p.image, p.originPrice, p.salePrice, p.idProduct, 
        s.name storName  
        FROM Product AS p 
        JOIN Store AS s 
        ON p.store_id = s.idStore 
        JOIN User AS u 
        ON s.user_id = u.idUser; 
        `;

    const mainResult = await pool.queryParam_Parse(selectMain);

    if (!mainResult) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));
    } else {
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, mainResult));
    }
});

router.get('/detail/:idProduct', async (req, res) => {
    const idProduct = req.params.idProduct;
    console.log("idProduct:: "+idProduct);

    const selectDetail =
        `
        SELECT p.idProduct, p.name proName, p.quantity, p.comment, p.image, p.originPrice, p.salePrice, p.expDate date,
        s.name stoName, s.address, s.lat, s.log, s.tel, u.userProfile 
        FROM Product AS p 
        JOIN Store AS s 
        ON p.store_id = s.idStore 
        JOIN User AS u 
        ON s.user_id = u.idUser
        WHERE p.idProduct = ?; 
        `;

    const detailResult = await pool.queryParam_Parse(selectDetail, [idProduct]);
    const lastTime = await time.dateDiff(detailResult[0].date);
    console.log("lastTime:::"+lastTime);
    var result = new Object();
    result = detailResult[0];
    result.expDate = lastTime;

    if (!detailResult) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));
    } else {
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, result));
    }
});

module.exports = router;