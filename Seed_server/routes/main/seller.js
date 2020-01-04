var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const util = require('../../module/utils/utils');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.get('/', async (req, res) => {
    const user = jwt.verify(req.headers.token);
    console.log("user::" + user.idx);

    if (user.idx == undefined) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_DATA));
    }
    

    const selectCount = 
    `
    SELECT COUNT(*) count
    FROM Product
    WHERE store_id = (
        SELECT idStore
        FROM Store
        WHERE user_id = ?
    );
    `;

    const selectMain =
        `
        SELECT p.name proName, p.quantity, p.image, p.originPrice, p.salePrice, p.idProduct 
        FROM Product AS p 
        JOIN Store AS s 
        ON p.store_id = s.idStore 
        WHERE s.user_id = ? AND p.expDate >= ? AND p.quantity > 0
        ORDER BY p.expDate;
        `;

    // const selectMain =
    // `
    // SELECT p.name proName, p.quantity, p.image, p.originPrice, p.salePrice, p.idProduct 
    // FROM Product AS p 
    // JOIN Store AS s 
    // ON p.store_id = s.idStore  
    // WHERE s.user_id = ? AND (p.expDate < ? OR p.quantity = 0);
    // `;

    const mainResult = await pool.queryParam_Parse(selectMain, [user.idx, moment().format('YYYY-MM-DD HH:mm:ss')]);
    const countResult = await pool.queryParam_Parse(selectCount, [user.idx]);

    if (!mainResult || !countResult) {
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));
    } else {
        var resData = {
            count: countResult[0].count,
            mainList: mainResult
        }
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.READ_SUCCESS, resData));
    }
});

module.exports = router;