var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const util = require('../../module/utils/utils');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

//구출하기 조회
router.get('/', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("idx::" + user.idx);

  let buyQuery =
    `
    SELECT p.name, p.image, p.salePrice, b.quantity, b.timePickup, b.packing, b.idBasket 
    FROM Product AS p 
    JOIN Basket AS b 
    ON p.idProduct = b.product_id 
    WHERE b.user_id = ? AND b.buyTF = 1;
    `;

  try {
    if (user.idx == undefined) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_TOKEN));
    }

    const selectResult = await pool.queryParam_Parse(buyQuery, [user.idx]);
    if (!selectResult) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.READ_FAIL));
    }
    else {
      console.log("buy::" + selectResult);

      var resultArray = new Array();

      for (var key in selectResult) {
        var result = new Object();
        const price = selectResult[key].salePrice;
        const packing = selectResult[key].packing;
        const quantity = selectResult[key].quantity;
        const sum = price * quantity + packing;

        result.sum = sum;
        result.name = selectResult[key].name;
        result.image = selectResult[key].image;
        resultArray.push(result);
      }

      console.log("sum:: " + JSON.stringify(result));
      res.status(200).send(util.successTrue(statusCode.OK, resMessage.READ_SUCCESS, resultArray));
    }
  } catch (err) {
    console.log("Select Buy Error => " + err);
  }

});

//구출하기
router.post('/', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("body:::" + JSON.stringify(req.body));

  let buyQuery =
    `
    UPDATE Basket 
    SET basketTF = 0, buyTF = 0  
    WHERE idBasket = ?;
    `;

  try {
    if (user.idx == undefined) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_TOKEN));
    }
    for (var key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        const idBasket = req.body[key].idBasket;
        var updateResult = await pool.queryParam_Parse(buyQuery, [idBasket]);
      }
    }
    if (!updateResult) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.UPDATE_FAIL));
    }
    else {
      res.status(200).send(util.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
    }
  } catch (err) {
    console.log("Update Buy Error => " + err);
    res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.UPDATE_FAIL, err));
  }
});

module.exports = router;
