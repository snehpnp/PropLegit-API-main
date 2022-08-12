var router = require('express').Router();
var SqlString = require('sqlstring');
const multer = require('multer');

const { executeQuery } = require('../MsSql/Query');
const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var viewName = 'view_PropertyDocument';

const upload = multer()

var GETPropertyDocumentTypeList = async (req, res) => {

    var MsSqlQuery = await SqlString.format(`Select DropDownItemID as [PropertyDocumentTypeID], DropDownValue as [PropertyDocumentType] from tbl_DropdownItem where DropDownID = 2`);

    try {

        var Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: Result.recordset, message: "Property Document Type List Fetch Successfully!!!" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Property Document Type List Fetch`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var POSTPropertyALLDocument = async (req, res) => {

    var { PropertyID } = { ...req.params };
    var { FileName, FileType, Description, CreatedBy, PropertyDocumentTypeID } = { ...req.body };
    var { FileExistenceCheck } = { ...req.query };

    if (!req.file || !FileName || !FileType || !PropertyDocumentTypeID) {
        var errMessage = `Please Upload Document File, Filename, FileType and PropertyID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    try {

        var model = await {
            PropertyID,
            DocumentTypeId: 1,
            DocumentSubTypeId: PropertyDocumentTypeID,
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

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: [DocumentResponce], message: "Property Document Uploaed Successfully!!!" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Upload Property ID ${req.params.PropertyID}'s Document`;
        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}


var GETPropertyALLDocument = async (req, res) => {

    var { PropertyID } = await { ...req.params };

    var MsSqlQuery = await SqlString.format(`Select pd.*, dtype.DropDownValue as DocumnetType from ${viewName} pd
    left join (Select DropDownItemID , DropDownValue from tbl_DropdownItem
        where DropDownID = 2) dtype on dtype.DropDownItemID = pd.DocumentSubTypeId
        where PropertyID = ? AND DocumentTypeID = 1
        AND DocumentsubTypeID IS NOT NULL`, [PropertyID])

    try {

        var result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "data successfully Fetched" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching Property's Document list`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }

}


router.get('/api/property/document/type/list', GETPropertyDocumentTypeList)
router.post('/api/property/:PropertyID/all/document/upload', upload.single('uploadfile'), POSTPropertyALLDocument);
router.get('/api/property/:PropertyID/all/document/list', GETPropertyALLDocument);

module.exports = router;