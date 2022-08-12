const router = require('express').Router();
const SqlString = require('sqlstring');
const multer = require('multer');

const { executeQuery } = require('../MsSql/Query');
const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

const ResponseModel = require('../Model/ResponseModel');
const modelBuilder = require('../helpers/modelBuilder');

const viewName = 'view_PropertyDocument';

const upload = multer();

var GETPHOTOGRAPH = async (req, res) => {

    var { PropertyID } = { ...req.params }

    var MsSqlQuery = await SqlString.format(`Select * from ${viewName} where PropertyID = ? AND DocumentTypeID IS NULL AND (IsDeleted IS NULL OR IsDeleted = 0) `, [PropertyID]);

    try {
        var result = await executeQuery(MsSqlQuery);
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "data successfully Fetched" }, new ResponseModel()));
    } catch (err) {
        var errMessage = `An error occurred during Fetching Property's Photogragh List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var POSTPHOTOGRAPH = async (req, res) => {
    var { PropertyID } = { ...req.params };
    var { FileName, FileType, Description, CreatedBy } = { ...req.body };
    var { FileExistenceCheck } = { ...req.query };

    if (!req.file || !FileName || !FileType) {
        var errMessage = `Please Upload Document File, Filename, FileType and PropertyID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    try {

        var model = await {
            PropertyID,
            DocumentTypeId: null,
            DocumentSubTypeId: null,
            FileExistenceCheck: FileExistenceCheck,
            IpAddress: null,
            FileName,
            FileType,
            Description,
            UserID: CreatedBy,
            CreatedBy
        }
        var DocumentResponce = await SaveDocumentGetDocumentID(model, req.file)

        if (DocumentResponce.FileExistence) {
            return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
        }

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: [DocumentResponce], message: "Property Photograph Uploaed Successfully!!!" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Property ID ${req.params.PropertyID}'s Photo Video`;
        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var DELETEPHOTOGRAPH = async (req, res) => {
    var MsSqlQuery = await SqlString.format(`Update tbl_FileID set IsDeleted=1 where FileID = ?`, [req.params.FileID]);

    try {

        var result = await executeQuery(MsSqlQuery);
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.rowsAffected, message: "data successfully Fetched" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Deleting Property's Photogragh`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.get('/api/property/:PropertyID/photograph', GETPHOTOGRAPH);
router.post('/api/property/:PropertyID/photograph/add', upload.single('uploadfile'), POSTPHOTOGRAPH);
router.delete('/api/property/photograph/:FileID', DELETEPHOTOGRAPH);

module.exports = router;