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

    //console.log("body:::" + JSON.stringify(req.body));

    if (req.body == undefined) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_DATA));
    }

    let insertStoreQuery =
        `INSERT INTO Store (name, address, user_id, lat, log, tel) VALUES (?, ?, ?, ?, ?, ?);`;

    let insertTimeQuery =
        `INSERT INTO StoreTime (idStore, day, startTime, endTime) VALUES (?, ?, ?, ?);`;

    let selectStoreQuery =
        `SELECT idStore FROM Store WHERE tel = ?;`;

    try {
        const insertTransaction = await pool.Transaction(async (connection) => {
            const insertStoreResult = await connection.query(insertStoreQuery, [name, address, user.idx, lat, log, tel]);
            const idStoreResult = await connection.query(selectStoreQuery, [tel]);

            console.log("idStore:::" + JSON.stringify(idStoreResult));

            for (var key in req.body.time) {
                if (req.body.time.hasOwnProperty(key)) {
                    //do something with e.g. req.body[key]
                    console.log("body???:::" + JSON.stringify(req.body));
                    console.log("day???:::" + JSON.stringify(req.body.time[key].day));
                    const day = req.body.time[key].day;
                    const startTime = req.body.time[key].startTime;
                    const endTime = req.body.time[key].endTime;

                    var timeResult = await connection.query(insertTimeQuery, [idStoreResult[0].idStore, day, startTime, endTime]);
                }
            }
        });


        if (!insertTransaction) {
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.SAVE_FAIL));
        } else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
        }
    } catch(err) {
        console.log("Store Error => " + err);
    }
});


module.exports = router;