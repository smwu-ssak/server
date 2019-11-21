var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const util = require('../../module/utils/utils');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

router.get('/', async (req, res) => {

  const user = jwt.verify(req.headers.token);
  console.log("idx::" + user.idx);
  try {
    if (user == null)
      res.status(200).send(util.successFalse(statusCode.INVALID_TOKEN, resMessage.INVALID_TOKEN));

    const myProfileQuery = 'SELECT userName, userProfile FROM User WHERE idUser = ?';
    const result = await pool.queryParam_Parse(myProfileQuery, [user.idx]);
    //응답 보내줄때 쿼리 문을 보내주는 것이 아니라 그 쿼리문의 결과를 보내줘야 해서 result값을 보내야 합니다잉 
    res.status(200).send(util.successTrue(200, resMessage.READ_SUCCESS, result));
  } catch (error) {
    res.status(200).send(util.successFalse(400, resMessage.READ_FAIL, error));
  }

});

router.get('/buy_list', async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("idx::" + user.idx);

  let buyListQuery =
    `
    SELECT p.name, p.image, p.salePrice, b.quantity, b.packing, b.idBasket 
    FROM Product AS p 
    JOIN Basket AS b 
    ON p.idProduct = b.product_id 
    WHERE b.user_id = ? AND b.buyTF = 0;
    `;

  try {
    if (user == null)
      res.status(200).send(util.successFalse(statusCode.INVALID_TOKEN, resMessage.INVALID_TOKEN));

    const buyListResult = await pool.queryParam_Parse(buyListQuery, [user.idx]);
    if (!buyListResult) {
      res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.READ_FAIL));
    }
    else {
      var resultArray = new Array();

      for (var key in buyListResult) {
        var result = new Object();
        const price = buyListResult[key].salePrice;
        const packing = buyListResult[key].packing;
        const quantity = buyListResult[key].quantity;
        const sum = price * quantity + packing;

        result.sum = sum;
        result.name = buyListResult[key].name;
        result.image = buyListResult[key].image;
        result.quantity = buyListResult[key].quantity;
        
        resultArray.push(result);
      }

      res.status(200).send(util.successTrue(statusCode.OK, resMessage.READ_SUCCESS, resultArray));
    }
  } catch (error) {
    res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.READ_FAIL, error));
  }

});

module.exports = router;
