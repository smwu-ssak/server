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
    var accessToken = req.body.token;
    var userWho = req.body.userWho;

    console.log("user who:::"+userWho);

    if ( userWho == undefined || accessToken == undefined ) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    }
    if ( userWho !== 0 && userWho !== 1 ) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
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
        'INSERT INTO User (userName, userId, userProfile, userWho) VALUES (?, ?, ?, ?)';

    try {
        let kakaoResult = await request(option);

        var id = kakaoResult.id;
        var nickname = kakaoResult.properties.nickname;
        var img_url = kakaoResult.properties.thumbnail_image;

        if(img_url==null){
            img_url='https://ssak-bucket.s3.ap-northeast-2.amazonaws.com/1573961943451.png';
        }
        if (id != undefined) {
            let selectIdQuery = 'SELECT userId FROM User WHERE userId = ?';
            const selectResult = await pool.queryParam_Parse(selectIdQuery, [id]);

            if (selectResult[0] == null) {
                console.log("user who222:::"+userWho);

                const insertSignupResult = await pool.queryParam_Parse(insertSignupQuery, [nickname, id, img_url, userWho]);

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
                            token : newToken.token,
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
    }
});

router.get('/', async (req, res) => {
    const user = jwt.verify(req.headers.token);

    var selectUser = 
    `
    SELECT *
    FROM Store
    WHERE user_id = ?;
    `;

    var selectResult = await pool.queryParam_Parse(selectUser, user.idx);

    if(!selectResult[0]){
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.NO_USER));
    }else{
        res.status(200).send(util.successTrue(statusCode.DUPLICATE_VALUES, resMessage.ALREADY_USER));
    }

})

module.exports = router;