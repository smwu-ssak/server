var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const util = require('../../module/utils/utils');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

router.get('/', async (req, res) => {

  const user = jwt.verify(req.headers.token);
  try {
    if (user == null)
      res.status(200).send(util.successFalse(404, resMessage.READ_FAIL));

    const myProfileQuery = 'SELECT userName, userProfile FROM User WHERE idUser = ?';
    const result = await pool.queryParam_Parse(myProfileQuery, [user.idx]);
    res.status(200).send(util.successTrue(200, resMessage.READ_SUCCESS, myProfileQuery));
  } catch (error) {
    res.status(200).send(util.successFalse(400, resMessage.READ_FAIL));
  }

});

module.exports = router;
