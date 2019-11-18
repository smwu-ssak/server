var express = require('express');
var router = express.Router();

const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');
const upload = require('../../config/multer');

//상품 등록
router.post('/', upload.single('image'), async (req, res) => {
    const user = jwt.verify(req.headers.token);

    console.log("body:::" + JSON.stringify(req.body));

    const name = req.body.name;
    const quantity = req.body.quantity;
    const originPrice = req.body.originPrice; //원래 가격
    const salePrice = req.body.salePrice; //판매 가격
    const expDate = req.body.expDate;
    const comment = req.body.comment;
    const image = req.file.location;

    let idStoreQuery = 'SELECT idStore FROM Store WHERE user_id = ?';
    let productQuery =
    `
    INSERT INTO 
    Product (name, quantity, originPrice, salePrice, expDate, image, store_id, comment) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) ;
    `;

    try {
        const transaction = await pool.Transaction(async (connection) => {
            const idStoreResult = await connection.query(idStoreQuery, [user.idx]);
            console.log("idStore::"+idStoreResult[0].idStore);
            const store_id = idStoreResult[0].idStore;
            await connection.query(productQuery, [name, quantity, originPrice, salePrice, expDate, image, store_id, comment]);
        });

        if (!transaction) {
            res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
        }
        else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
        }
    } catch (err) {
        console.log("Product Error => " + err);
    }
});


module.exports = router;