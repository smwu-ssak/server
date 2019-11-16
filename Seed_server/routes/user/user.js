var express = require('express');
var router = express.Router();

const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const pool = require('../../module/pool');
const jwt = require('../../module/jwt');

const bodyParser = require('body-parser');
const request = require('request-promise');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

//유효한 토큰이라면 자체 토큰 생성해 res
router.post('/', async (req, res) => {

    // kakao access token
    let accessToken = req.body.token;

    if (!accessToken) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_TOKEN));
    }

    let option = {
        method: 'GET',
        uri: 'https://kapi.kakao.com/v2/user/me',
        json: true,
        headers: {
            'Authorization': "Bearer " + accessToken
        }
    }
    let insertSignupQuery =
        'INSERT INTO User (userName, userId, userProfile, userWho) VALUES (?, ?, ?, 0)';

    try {
        let kakaoResult = await request(option);

        var id = kakaoResult.id;
        var nickname = kakaoResult.properties.nickname;
        var img_url = kakaoResult.properties.thumbnail_image;

        if (id != undefined) {
            let selectIdQuery = 'SELECT userId FROM User WHERE userId = ?';
            const selectResult = await pool.queryParam_Parse(selectIdQuery, [id]);

            if (selectResult[0] == null) {
                const insertSignupResult = await pool.queryParam_Parse(insertSignupQuery, [nickname, id, img_url]);

                if (!insertSignupResult) {
                    res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.CREATED_USER_FAIL));
                } else {
                    let selectUserQuery = 'SELECT * FROM User WHERE userId = ?';
                    const selectUserResult = await pool.queryParam_Parse(selectUserQuery, [id]);
                    const newToken = jwt.sign(selectUserResult[0]);
                    res.status(201).send({
                        status: 200,
                        success: true,
                        message: "로그인 성공",
                        data : {
                            token : newToken.token
                        }
                    });
                }
            } else {
                let selectUserQuery = 'SELECT * FROM User WHERE userId = ?';
                const selectUserResult = await pool.queryParam_Parse(selectUserQuery, [id]);
                const newToken = jwt.sign(selectUserResult[0]);
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS, { "token": newToken.token }));
            }

        }
    }
    catch (err) {
        console.log("Kakao Error => " + err);
        next(err);
    }
});


module.exports = router;