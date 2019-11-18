var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const utils = require('../../module/utils/utils');
const upload = require('../../config/multer');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

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
        SELECT p.name proName, p.quantity, p.comment, p.image, p.originPrice, p.salePrice, p.expDate, u.userProfile,
        s.name stoName, s.address, s.lat, s.log, u.userProfile 
        FROM Product AS p 
        JOIN Store AS s 
        ON p.store_id = s.idStore 
        JOIN User AS u 
        ON s.user_id = u.idUser
        WHERE p.idProduct = ?; 
        `;

    const detailResult = await pool.queryParam_Parse(selectDetail, [idProduct]);

    if (!detailResult) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));
    } else {
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, detailResult[0]));
    }
});

module.exports = router;