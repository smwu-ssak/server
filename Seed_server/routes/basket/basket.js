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
  var now = new Date();

  let basketQuery =
    `
    SELECT p.name, p.quantity, p.image, p.salePrice, b.idBasket, b.quantity buyNum, b.timePickup, b.packing  
    FROM Product AS p 
    JOIN Basket AS b 
    ON p.idProduct = b.product_id 
    WHERE b.user_id = ? AND b.basketTF = 1 AND p.expDate > ?;
    `;

  try {
    if (user.idx == undefined) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_TOKEN));
    }

    const selectResult = await pool.queryParam_Parse(basketQuery, [user.idx, now]);
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
  WHERE product_id = ? AND user_id = ? AND basketTF = 1;
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

    const selectResult = await pool.queryParam_Parse(dupProduct, [req.params.idProduct, user.idx]);
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

//장바구니 삭제
router.delete('/:idProduct', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("user:::" + JSON.stringify(user.idx));

  let deleteProduct =
    `
    DELETE FROM Basket
    WHERE product_id = ? AND user_id = ? AND basketTF = 1;
  `;

  try {
    if (user == undefined) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    }

    const deleteResult = await pool.queryParam_Parse(deleteProduct, [req.params.idProduct, user.idx]);
    if (!deleteResult.affectedRows) {
      res.status(200).send(util.successFalse(statusCode.OK, resMessage.DELETE_FAIL));
    }
    else {
      res.status(200).send(util.successTrue(statusCode.OK, resMessage.DELETE_SUCCESS));
    }
  } catch (err) {
    console.log("Delete Basket Error => " + err);
  }
});

module.exports = router;
