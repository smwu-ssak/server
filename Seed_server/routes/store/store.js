var express = require('express');
var router = express.Router();

const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

//상점 등록
router.post('/', async (req, res) => {
    const user = jwt.verify(req.headers.token);

    const name = req.body.name;
    const address = req.body.address;
    const lat = req.body.lat; //위도
    const log = req.body.log; //경도
    const tel = req.body.tel;

    console.log("body:::"+JSON.stringify(req.body));

    if (req.body == undefined) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_DATA));
    }

    let insertStoreQuery =
        `INSERT INTO Store (name, address, user_id, lat, log, tel) VALUES (?, ?, ?, ?, ?, ?);`;

    try {
        const insertSignupResult = await pool.queryParam_Parse(insertStoreQuery, [name, address, user.idx, lat, log, tel]);

        if (!insertSignupResult) {
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.SAVE_FAIL));
        } else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
        }
    }
    catch (err) {
        console.log("Store Error => " + err);
        next(err);
    }
});


module.exports = router;