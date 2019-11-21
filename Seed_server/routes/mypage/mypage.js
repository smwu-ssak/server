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
      res.status(200).send(util.successFalse(404, resMessage.READ_FAIL));

    const myProfileQuery = 'SELECT userName, userProfile FROM User WHERE idUser = ?';
    const result = await pool.queryParam_Parse(myProfileQuery, [user.idx]);
    //응답 보내줄때 쿼리 문을 보내주는 것이 아니라 그 쿼리문의 결과를 보내줘야 해서 result값을 보내야 합니다잉 
    res.status(200).send(util.successTrue(200, resMessage.READ_SUCCESS, result[0]));
  } catch (error) {
    res.status(200).send(util.successFalse(400, resMessage.READ_FAIL));
  }

});

module.exports = router;
