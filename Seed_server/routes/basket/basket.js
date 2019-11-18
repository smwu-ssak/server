var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const util = require('../../module/utils/utils');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

//장바구니 조회
router.get('/', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("idx::" + user.idx);

  let basketQuery =
    `
    SELECT p.name, p.quantity, p.image, p.salePrice, b.idBasket
    FROM Product AS p 
    JOIN Basket AS b 
    ON p.idProduct = b.product_id 
    WHERE b.user_id = ? AND b.basketTF = 1;
    `;

  try {
    if (user.idx == undefined) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_TOKEN));
    }

    const selectResult = await pool.queryParam_Parse(basketQuery, [user.idx]);
    if (!selectResult) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.READ_FAIL));
    }
    else {
      res.status(200).send(util.successTrue(statusCode.OK, resMessage.READ_SUCCESS, selectResult));
    }
  } catch (err) {
    console.log("Select Basket Error => " + err);
  }

});

//장바구니 담기
router.get('/:idProduct', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("user:::" + JSON.stringify(user.idx));

  const dupProduct =
    `
  SELECT product_id
  FROM Basket
  WHERE product_id = ?;
  `;
  let basketQuery =
    `
    INSERT INTO 
    Basket (user_id, product_id) 
    VALUES (?, ?) ;
    `;

  try {
    if (user == undefined) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
    }

    const selectResult = await pool.queryParam_Parse(dupProduct, [req.params.idProduct]);
    if (selectResult[0] == null) {
      const insertResult = await pool.queryParam_Parse(basketQuery, [user.idx, req.params.idProduct]);
      if (!insertResult) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
      }
      else {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
      }
    } else {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.ALREADY_BASKET));
    }

  } catch (err) {
    console.log("Insert Basket Error => " + err);
  }
});

//장바구니 비우기
router.post('/', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("body:::" + JSON.stringify(req.body));

  // const name = req.body.name;
  // const quantity = req.body.quantity;
  // const originPrice = req.body.originPrice; //원래 가격
  // const salePrice = req.body.salePrice; //판매 가격
  // const expDate = req.body.expDate;
  // const comment = req.body.comment;
  // const image = req.file.location;

  let basketQuery =
    `
    UPDATE Basket 
    SET timePickup = ?, packing = ?, quantity = ?, basketTF = 0, buyTF = 1  
    WHERE idBasket = ?;
    `;

  try {
    if (user.idx == undefined) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_TOKEN));
    }

    for (var key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        //do something with e.g. req.body[key]
        console.log("body???:::" + JSON.stringify(req.body[key].quantity));
        const timePickup = req.body[key].timePickup;
        const packing = req.body[key].packing;
        const quantity = req.body[key].quantity;
        const idBasket = req.body[key].idBasket;

        var selectResult = await pool.queryParam_Parse(basketQuery, [timePickup, packing, quantity, idBasket]);
      }
    }

    if (!selectResult) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
    }
    else {
      res.status(200).send(util.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    }
} catch (err) {
  console.log("Update Basket Error => " + err);
}
});

module.exports = router;
