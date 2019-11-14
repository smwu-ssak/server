var randtoken = require('rand-token');
const jwt = require('jsonwebtoken');
const secretOrPrivateKey = "jwtSecretKey!";
const options = {
    algorithm: "HS256",
    expiresIn: "1h",
    issuer: "jinee"
};
const refreshOptions = {
    algorithm: "HS256",
    expiresIn: "24h * 14",
    issuer: "jinee"
};

module.exports = {
    sign: (user) => {
        const payload = {
            userIdx: user.userIdx,
            name: user.name,
            id:user.id
        };

        const result = {
            token: jwt.sign(payload, secretOrPrivateKey),
            refreshToken: randtoken.uid(256) //refreshToken 안쓰고 싶으면 지우면 됨 유효기간 주로 2주
        };
        //refreshToken을 만들 때에도 다른 키를 쓰는게 좋다.

        return result;
    },
    verify: (token) => {
        let decoded;
        try {
            decoded = jwt.verify(token, secretOrPrivateKey);
        } catch (err) {
            if (err.message === 'jwt expired') {
                console.log('expired token');
                return -3;
            } else if (err.message === 'invalid token') {
                console.log('invalid token');
                return -2;
            } else {
                console.log("invalid token");
                return -2;
            }
        }
        return decoded;
    },
    refresh: (user) => {
        const payload = {
            idx: user.userIdx,
            name: user.name
        };

        return jwt.sign(payload, secretOrPrivateKey, options);
    }
};