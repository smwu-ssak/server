var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const utils = require('../../module/utils/utils');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.post('/', async (req, res) => {
    const user = jwt.verify(req.headers.token);
    console.log("body:::" + JSON.stringify(req.body));
    console.log("token:::" + JSON.stringify(user.idx));

    if (!req.body || !req.headers.token) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    }

    if (!user.idx) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_TOKEN));
    }

    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var address = req.body.address;

    const insertGPS =
        `
        INSERT INTO
        Location (user_id, latitude, longitude, address) 
        VALUES (?, ?, ?, ?);
        `;

    const gpsResult = await pool.queryParam_Parse(insertGPS, [user.idx, latitude, longitude, address]);

    if (!gpsResult.affectedRows) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.SAVE_FAIL));
    } else {
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    }
});

router.get('/', async (req, res) => {
    const user = jwt.verify(req.headers.token);
    console.log("body:::" + JSON.stringify(req.body));
    console.log("token:::" + JSON.stringify(user.idx));

    if (!req.body || !req.headers.token) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    }

    if (!user.idx) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_TOKEN));
    }

    const selectGPS =
        `
        SELECT latitude, longitude
        FROM Location
        WHERE user_id = ?
        ORDER BY idLocation DESC;
        `;

    const gpsResult = await pool.queryParam_Parse(selectGPS, [user.idx]);

    if (!gpsResult[0]) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));
    } else {
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, gpsResult));
    }
});


module.exports = router;