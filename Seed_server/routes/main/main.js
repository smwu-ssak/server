var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const utils = require('../../module/utils/utils');
const upload = require('../../config/multer');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

router.get('/', async (req, res) => {
    //const user = jwt.verify(req.headers.token);

    //if (user === null || !req.headers.token) {
    //    res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    //} else {
        const selectUserPost =
            'SELECT * FROM User WHERE idUser = ? ';

        var postResult = await pool.queryParam_Parse(selectUserPost, [1]);

        if (!postResult) {
            res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));
        } else {
            res.status(200).send(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, postResult));
        }


   // }
});

module.exports = router;