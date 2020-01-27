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

//구출하기 조회
router.get('/', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("idx::" + user.idx);

  let buyQuery =
    `
    SELECT p.name, p.image, p.salePrice, b.quantity, b.timePickup, b.packing 
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
      res.status(200).send(util.successFalse(statusCode.DB, resMessage.READ_FAIL));
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

        result=selectResult[key]
        result.totalPrice = sum;
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

//구출확정
router.post('/', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("body:::" + JSON.stringify(req.body));

  let selectBuy =
  `
  SELECT idBasket, product_id, quantity 
  FROM Basket
  WHERE user_id = ? AND buyTF = 1;
  `;
  let buyQuery =
  `
  UPDATE Basket 
  SET basketTF = 0, buyTF = 0  
  WHERE idBasket = ?;
  `;

  let updateProduct = 
  `
  UPDATE Product 
  SET quantity = ?   
  WHERE idProduct = ?;
  `;
  let selectProduct = 
  `
  SELECT quantity
  FROM Product 
  WHERE idProduct = ?;
  `;
  
  try {
    if (user.idx == undefined) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_TOKEN));
    }

    //구매 확정에 따른 원래 상품 갯수 감소 처리
    var userIdResult = await pool.queryParam_Parse(selectBuy, [user.idx]);

    if(userIdResult[0]==null)
      res.status(200).send(util.successFalse(statusCode.NOT_FOUND, resMessage.NO_DATA));

    const transaction = await pool.Transaction(async (connection) => {
      for (var key in userIdResult) {
        const idBasket = userIdResult[key].idBasket;
        const product_id = userIdResult[key].product_id;
        const quantity = userIdResult[key].quantity;
        
        console.log("userId::" + JSON.stringify(userIdResult[key].idBasket));
        var updateResult = await connection.query(buyQuery, [idBasket]);
        if(!updateResult.affectedRows)
          res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.UPDATE_FAIL));
        var quantityResult = await connection.query(selectProduct, [product_id]);
        var newQuantity = quantityResult[0].quantity - quantity;
        if(newQuantity>=0){
          var updateResult = await connection.query(updateProduct, [newQuantity, product_id]);
          if(!updateResult.affectedRows){
            console.log(err);
          }
        }else{
          res.status(200).send(util.successFalse(statusCode.SERVICE_UNAVAILABLE, resMessage.ALREADY_BOUGHT));
        }
      }
    });

    if (!transaction) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.UPDATE_FAIL));
    }
    else {
      res.status(200).send(util.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
    }
  } catch (err) {
    console.log("Update Buy Error => " + err);
    res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.UPDATE_FAIL, err));
  }
});

//구출하러 가기
router.post('/now', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("body:::" + JSON.stringify(req.body));

  let basketQuery =
    `
    UPDATE Basket 
    SET timePickup = ?, packing = ?, quantity = ?, buyTF = 1  
    WHERE idBasket = ?;
    `;

  try {
    if (user.idx == undefined) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_TOKEN));
    }

    var now = moment();

    for (var key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        //do something with e.g. req.body[key]
        console.log("body???:::" + JSON.stringify(req.body[key].quantity));
        const timePickup = moment().format('YYYY-MM-DD HH:mm:ss');
        const packing = req.body[key].packing;
        const quantity = req.body[key].quantity;
        const idBasket = req.body[key].idBasket;

        var selectResult = await pool.queryParam_Parse(basketQuery, [timePickup, packing, quantity, idBasket]);
      }
    }

    if (!selectResult) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.UPDATE_FAIL));
    }
    else {
      res.status(200).send(util.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
    }
  } catch (err) {
    console.log("Update Basket Error => " + err);
  }
});

//구출하기 삭제
router.delete('/:idProduct', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("user:::" + JSON.stringify(user.idx));

  let deleteProduct =
    `
    DELETE FROM Basket
    WHERE product_id = ? AND user_id = ? AND buyTF = 1;
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
    console.log("Delete Buy Error => " + err);
  }
});

module.exports = router;
