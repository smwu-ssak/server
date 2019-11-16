var express = require('express');
var router = express.Router();

const resMessage = require('../../module/utils/responseMessage');
const statusCode = require('../../module/utils/statusCode');
const utils = require('../../module/utils/utils');
const upload = require('../../config/multer');

router.post('/', upload.single('image'), (req, res) => {

    res.status(statusCode.OK).send(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS, req.file.location));
});

module.exports = router;
