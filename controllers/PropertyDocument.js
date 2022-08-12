var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');
const multer = require('multer');

const { executeQuery, runStoredProcedure } = require('../MsSql/Query');
const { UploadFile, checkFile } = require('../shared/S3Bucket');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var PropertyDocumentModel = require('../Model/PropertyDocumentModel');

var CurrentDateTime = require('../shared/CurrentDateTime');


var spName = 'sp_POST_PropertyDocument';
var viewName = 'view_PropertyDocument';

const upload = multer()

var POSTPropertyDocument = (req, res) => {

    if (!req.file || !req.params.PropertyID) {
        var errMessage = `Please Upload Document File and PropertyID`;
        APIErrorLog(null, null, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    } else {

        checkFile(req.params.PropertyID, req.body.DocumentTypeId, req.body.FileName)
            .then(data => {

                if (data.code !== 'NotFound' && req.query.FileExistenceCheck == 1) {
                    var errMessage = `File already exists do you want to overwrite?`;
                    return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: errMessage }, new ResponseModel()));
                }

                UploadFile(req.file, req.params.PropertyID, req.body.DocumentTypeId, req.body.FileName)
                    .then(result => {
                        var model = new modelBuilder().buildModel(req.body, new PropertyDocumentModel());

                        model.PropertyID = req.params.PropertyID;
                        model.FileURL = result.Location;
                        model.Key = result.Key;
                        model.S3BucketName = result.Bucket;
                        model.IpAddress = req.myCustomAttributeName;
                        model.CreatedAt = CurrentDateTime();
                        model.CreatedBy = req.body.CreatedBy;

                        var inputparams = [];

                        Object.keys(model).forEach(element => {
                            inputparams.push({
                                "name": element,
                                "type": sql.NVarChar,
                                "value": model[element] ? model[element] : null
                            })
                        });

                        runStoredProcedure(spName, inputparams)
                            .then(result => {
                                res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "Property Document successfully Uploaded!!" }, new ResponseModel()));
                            })
                            .catch(err => {
                                var errMessage = `An error occurred during Adding Property Document`;
                                APIErrorLog(spName, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                            })
                    })
                    .catch(err => {

                        if (err === 'Invalid DocumentType') {
                            res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'INVALID_TYPE', error: err }, new ResponseModel()));

                        } else if (err === 'File already exists') {
                            res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'FILE_EXISTS', error: err }, new ResponseModel()));

                        } else {
                            var errMessage = `An error occurred during Uploading File`;
                            APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                        }
                    })


            })
            .catch(err => {
                var errMessage = `An error occurred check during File exsistance.`;
                APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            })

    }
}


var GETPropertyDocumentByID = (req, res) => {

    var MsSqlQuery = SqlString.format(`Select * from ${viewName} where PropertyID = ? AND DocumentID = ?`, [req.params.PropertyID, req.params.DocumentID]);

    executeQuery(MsSqlQuery)
        .then(result => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Property's Document Details`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

router.post('/api/property/:PropertyID/document/add', upload.single('uploadfile'), POSTPropertyDocument);
router.get('/api/property/:PropertyID/Document/View/:DocumentID', GETPropertyDocumentByID);

module.exports = router;