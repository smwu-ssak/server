var express = require('express');
var router = express.Router();

const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const crypto = require('crypto-promise');
const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

var request = require('request');



//유효한 토큰이라면 자체 토큰 생성해 res
router.post('/', async (req, res) => {
    const token = req.body.token;
    var id = 0;
    var profile = 0;
    var name = 0;
    

    var options = {
        url: 'https://kapi.kakao.com/v2/user/me',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
    };

    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            id = info.id;
            profile = info.kakao_account.profile.profile_image_url;
            name = info.kakao_account.profile.nickname;

            console.log(info.id + " idddd");
            console.log(info.kakao_account.profile.profile_image_url + " urllll");
        } else {
            console.log(response.statusCode + " errrrrr");
            console.log(error + " errrrrr");
            res.status(200).send(util.successFalse(response.statusCode, error));
        }
    }

    request.get(options, callback);

    const selectIdQuery = 'SELECT * FROM User WHERE userId = ?';
    const selectResult = await pool.queryParam_Parse(selectIdQuery, [id]);
    const newToken = jwt.sign(selectResult[0]);

    if (selectResult[0] == null) {
        const insertSignupQuery =
            'INSERT INTO User (userName, userId, userProfile, userWho) VALUES (?, ?, ?, 0)';
        const insertSignupResult = await pool.queryParam_Parse(insertSignupQuery, [name, id, profile]);

        if (!insertSignupResult) {
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.CREATED_USER_FAIL));
        } else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.CREATED_USER_SUCCESS), {"token": newToken.token});
        }
        res.status(200).send(util.successFalse(statusCode.NO_USER, resMessage.NO_USER));

    } else {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS, {"token": newToken.token}));
    }
});


module.exports = router;