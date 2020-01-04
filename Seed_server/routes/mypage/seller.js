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

router.get('/', async (req, res) => {
    const user = jwt.verify(req.headers.token);
    console.log("idx::" + user.idx);
    try {
        if (user.idx == undefined)
            res.status(200).send(util.successFalse(statusCode.INVALID_TOKEN, resMessage.INVALID_TOKEN));

        const storeQuery = 'SELECT address, tel FROM Store WHERE user_id = ?';
        const storeTimeQuery = 
        `
        SELECT day, startTime, endTime
        FROM StoreTime 
        WHERE idStore = (
            SELECT idStore
            FROM Store
            WHERE user_id = ?
        )
        `;

        const storeResult = await pool.queryParam_Parse(storeQuery, [user.idx]);
        if(storeResult[0].address == undefined)
            res.status(200).send(util.successFalse(200, resMessage.READ_FAIL));
        
        console.log("store::" + storeResult);

        const storeTimeResult = await pool.queryParam_Parse(storeTimeQuery, [user.idx]);
        if(storeTimeResult[0].day == undefined)
            res.status(200).send(util.successFalse(200, resMessage.READ_FAIL));
        
        console.log("storeTimeResult::" + storeTimeResult);

        var resData = {
            "address":storeResult[0].address,
            "tel":storeResult[0].tel,
            "time": storeTimeResult
        }
        //응답 보내줄때 쿼리 문을 보내주는 것이 아니라 그 쿼리문의 결과를 보내줘야 해서 result값을 보내야 합니다잉 
        res.status(200).send(util.successTrue(200, resMessage.READ_SUCCESS, resData));
    } catch (error) {
        res.status(200).send(util.successFalse(200, resMessage.READ_FAIL, error));
    }
});

router.patch('/address', async (req, res) => {
    const user = jwt.verify(req.headers.token);

    const address = req.body.address;
    const lat = req.body.lat; //위도
    const log = req.body.log; //경도

    if (req.body == undefined) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_DATA));
    }

    let updateAddressQuery =
        `
    UPDATE Store 
    SET address = ?, lat = ?, log = ?
    WHERE user_id = ?;
    `;

    try {

        var updateResult = await pool.queryParam_Parse(updateAddressQuery, [address, lat, log, user.idx]);

        if (!updateResult.affectedRows) {
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.UPDATE_FAIL));
        } else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
        }
    } catch (err) {
        console.log("UPDATE SELLER ADDRESS Error => " + err);
    }
});

router.patch('/tel', async (req, res) => {
    const user = jwt.verify(req.headers.token);

    if (req.body == undefined) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_DATA));
    }

    const tel = req.body.tel;

    let updateTelQuery =
        `
    UPDATE Store 
    SET tel = ?
    WHERE user_id = ?;
    `;

    try {

        var updateResult = await pool.queryParam_Parse(updateTelQuery, [tel, user.idx]);

        if (!updateResult.affectedRows) {
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.UPDATE_FAIL));
        } else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
        }
    } catch (err) {
        console.log("UPDATE SELLER TEL Error => " + err);
    }
});

router.patch('/time', async (req, res) => {
    const user = jwt.verify(req.headers.token);

    //console.log("body:::" + JSON.stringify(req.body));

    if (req.body == undefined) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_DATA));
    }

    let updateTelQuery =
        `
    UPDATE StoreTime 
    SET startTime = ?, endTime = ?
    WHERE idStore = ? AND day = ?
    `;

    let selectStoreIdQuery =
        `
    SELECT idStore
    FROM Store
    WHERE user_id = ?;
    `;

    try {
        var idStoreResult = await pool.queryParam_Parse(selectStoreIdQuery, [user.idx]);
        if (!idStoreResult) {
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));
        }

        var rows = 0;
        for (var key in req.body) {
            if (req.body.hasOwnProperty(key)) {
                //do something with e.g. req.body[key]
                console.log("body???:::" + JSON.stringify(req.body));
                console.log("day???:::" + JSON.stringify(req.body[key].day));
                const day = req.body[key].day;
                const startTime = req.body[key].startTime;
                const endTime = req.body[key].endTime;

                var timeResult = await pool.queryParam_Parse(updateTelQuery, [startTime, endTime, idStoreResult[0].idStore, day]);
                rows += timeResult.affectedRows;
                console.log("type::" + rows);

            }
        }
        if (rows == req.body.length) {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
        } else {
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.UPDATE_FAIL));
        }

    } catch (err) {
        console.log("UPDATE TIME Error => " + err);
    }
});


module.exports = router;
