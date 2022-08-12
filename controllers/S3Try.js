var router = require('express').Router();
const multer = require('multer')
const AWS = require('aws-sdk');
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery, runStoredProcedure, UpdateQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');


var TableName = 'tbl_OTP_Log';
var spName = 'sp_POST_usermaster';

const s3 = new AWS.S3({
    accessKeyId: 'AKIAT4PKFXBO26UL4NBK',
    secretAccessKey: '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'
})

const storage = multer.memoryStorage({
    destination: function (req, file, callback) {
        callback(null, '')
    }
})

const upload = multer({ storage }).single('image');

var GETS3Try = (req, res) => {
    const params = {
        Bucket: 'proplegit-dev'
        // Key: ''
    }

    s3.listObjects(params, (err, data) => {
        if (err) {

            return res.status(400).send({ err })
        }
        var arrayBufferView = new Uint8Array(data.Body);
        var STRING_CHAR = String.fromCharCode.apply(null, arrayBufferView);
        var base64String = Buffer.from(STRING_CHAR).toString('base64');
        res.send(data);
    })
}


var POSTS3Try = (req, res) => {

    const params = {
        Bucket: 'proplegit-dev',
        Key: `1/${req.file.originalname}`
        // ACL:'public-read',
        // Body: req.file.buffer
    }




    s3.headObject(params, (error, data) => {
        if (error) {
            return res.status(500).send('not found');
        }
        res.status(200).send('file found');
    })

    // s3.upload(params, (error, data) => {
    //     if(error){
    //         res.status(500).send(error)
    //     }

    //     res.status(200).send(data)
    // })

}

var DELETES3Try = (req, res) => {
    const params = {
        Bucket: 'proplegit-dev',
        Key: 'web-technologies-banner-Recovered.jpg'
    }

    s3.deleteObject(params, (err, data) => {
        if (err) {

            return res.status(400).send({ err })
        }
        res.send(data)
    })
}


router.get('/api/s3Try', GETS3Try);
router.post('/api/s3Try', upload, POSTS3Try);
router.delete('/api/s3Try', DELETES3Try);

module.exports = router;