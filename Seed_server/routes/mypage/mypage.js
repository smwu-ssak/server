var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const util = require('../../module/utils/utils');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');
const upload = require('../../config/multer');


var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.get('/', async (req, res) => {

  const user = jwt.verify(req.headers.token);
  console.log("idx::" + user.idx);
  try {
    if (user == null)
      res.status(200).send(util.successFalse(statusCode.INVALID_TOKEN, resMessage.INVALID_TOKEN));

    const myProfileQuery = 'SELECT userName, userProfile FROM User WHERE idUser = ?';
    const result = await pool.queryParam_Parse(myProfileQuery, [user.idx]);
    //응답 보내줄때 쿼리 문을 보내주는 것이 아니라 그 쿼리문의 결과를 보내줘야 해서 result값을 보내야 합니다잉 
    res.status(200).send(util.successTrue(200, resMessage.READ_SUCCESS, result[0]));
  } catch (error) {
    res.status(200).send(util.successFalse(400, resMessage.READ_FAIL, error));
  }

});

router.get('/buy_list', async (req, res) => {

  const user = jwt.verify(req.headers.token);
  console.log("idx::" + user.idx);

  let buyListQuery =
    `
    SELECT p.name, p.salePrice, b.quantity, b.packing, SUBSTR(b.timePickup, 1,10) timePickup 
    FROM Product AS p 
    JOIN Basket AS b 
    ON p.idProduct = b.product_id 
    WHERE b.user_id = ? AND SUBSTR(b.timePickup, 1,10) = ? AND b.buyTF = 0 AND basketTF = 0;
    `;

  const dateQuery = 
  `
  SELECT DISTINCT SUBSTR(timePickup, 1,10) date
  FROM Basket 
  WHERE user_id = ? AND buyTF = 0 AND basketTF = 0
  ORDER BY timePickup DESC;
  `;

  try {
    if (user == null)
      res.status(200).send(util.successFalse(statusCode.INVALID_TOKEN, resMessage.INVALID_TOKEN));

    const dateResult = await pool.queryParam_Parse(dateQuery, [user.idx]);
    console.log("dateQUERY::"+JSON.stringify(dateResult));
    
    var resultArray = new Array();

    for (var key in dateResult) {
      const time = new Object();
      const date = dateResult[key].date;
      time.time = date;
      console.log("time::"+JSON.stringify(time));

      console.log("date::"+key+"??"+date);
      const buyListResult = await pool.queryParam_Parse(buyListQuery, [user.idx, date]);

      console.log("buyListResult::"+JSON.stringify(buyListResult));

      var array = new Array();

      for (var i in buyListResult) {
        var result = new Object();

        const price = buyListResult[i].salePrice;
        const packing = buyListResult[i].packing;
        const quantity = buyListResult[i].quantity;
        const sum = price * quantity + packing;
        result.sum = sum;
        result.time = buyListResult[i].timePickup;
        result.name = buyListResult[i].name;

        
        array.push(result);
        //console.log("sum::"+sum);
      }
      time.data = array;
      console.log("arrTime+"+JSON.stringify(time));

      resultArray.push(time);
    }

    if (!result) {
      //res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.READ_FAIL));
    }
    else {
      res.status(200).send(util.successTrue(statusCode.OK, resMessage.READ_SUCCESS, resultArray));
    }
  } catch (error) {
    res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.READ_FAIL, error));
  }

});

router.patch('/', upload.single('profile'), async (req, res) => {
  const user = jwt.verify(req.headers.token);
  console.log("userIdx::"+user.idx);


  if (user.idx == undefined) {
      res.status(200).send(util.successFalse(statusCode.INVALID_TOKEN, resMessage.INVALID_TOKEN));
  } else {
      const updateUserQuery = 
      `
      UPDATE User 
      SET userName = ?, userProfile = ?
      WHERE idUser = ?;
      `;
      const userName = req.body.name;
      console.log("name:::"+userName);
      const userProfile = req.file.location;
      console.log("profile:::"+req.file.location);

      if(userName == undefined)
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_DATA));
      
      const userResult = await pool.queryParam_Parse(updateUserQuery, [userName, userProfile, user.idx]);

      if(userResult.affectedRows)
          res.status(200).send(util.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
      else
          res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.UPDATE_FAIL));
  }
});


module.exports = router;
