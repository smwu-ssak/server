var express = require('express');
var router = express.Router();

const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const crypto = require('crypto-promise');
const pool = require('../../module/pool');
const jwt = require('../../module/jwt');


router.get('/signin', async (req, res) => {
    const selectIdQuery = 'SELECT * FROM User WHERE userId = ?';
    const selectSellerQuery = 'SELECT * FROM Seller WHERE user_id = ?';
    
    const userResult = await pool.queryParam_Parse(selectIdQuery, [req.body.userId]);
    const sellerResult = await pool.queryParam_Parse(selectSellerQuery, [userResult[0].idUser]);
    
    const pwd = req.body.password;

    if (!req.body.userId || !req.body.password) {
        res.status(statusCode.OK).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        if (userResult[0] == null) {
            res.status(200).send(util.successFalse(statusCode.NO_USER, resMessage.NO_USER));
        } else {
            const hashedPw = await crypto.pbkdf2(pwd.toString(), sellerResult[0].salt, 1000, 32, 'SHA512');

            if (sellerResult[0].password == hashedPw.toString('base64')) {
                const token = jwt.sign(userResult[0]);

                var resData={
                    "token": token.token
                }
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS, resData));
            } else {
                res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.MISS_MATCH_PW));
            }
        }
    }
});

router.post('/signup', async (req, res) => {
    const selectIdQuery = 'SELECT userId FROM User WHERE userId = ?';
    const selectIdResult = await pool.queryParam_Parse(selectIdQuery, [req.body.userId]);

    const userId = req.body.userId;
    const password = req.body.password;

    if (!selectIdResult[0]) {
        const buf = await crypto.randomBytes(64);
        const salt = buf.toString('base64');
        const hashedPw = await crypto.pbkdf2(password.toString(), salt, 1000, 32, 'SHA512');

        const insertUser =
            'INSERT INTO User (userId, userWho) VALUES (?, 1)';
            
        const insertSeller =
            'INSERT INTO Seller (user_id, password, salt) VALUES (?, ?, ?)';
            
        const selectUser =
            'SELECT idUser FROM User WHERE userId = ?';
        
        try {
            const transaction = await pool.Transaction(async (connection) => {
                const userResult = await connection.query(insertUser, [userId]);
                if (!userResult.affectedRows) {
                    console.log(err);
                }
                const selectResult = await connection.query(selectUser, [userId]);

                const sellerResult = await connection.query(insertSeller, [selectResult[0].idUser, hashedPw.toString('base64'), salt]);
                if (!sellerResult.affectedRows) {
                    console.log(err);
                }
            });
    
            if (!transaction) {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
            }
            else {
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
            }
        } catch (err) {
            console.log("Signup Error => " + err);
        }
        
    } else {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.ALREADY_USER));
    }
});

router.get('/checkId', async (req, res) => {
    const selectIdQuery = 'SELECT userId FROM User WHERE userId = ?';
    const selectIdResult = await pool.queryParam_Parse(selectIdQuery, [req.body.userId]);

        console.log(JSON.stringify(selectIdResult));
        
    if (!selectIdResult[0]) {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.AVAILABLE_NICKNAME));
    } else {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.DUPLICATION_NICKNAME));
    }
});

module.exports = router;