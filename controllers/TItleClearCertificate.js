var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery, runStoredProcedure, UpdateQuery } = require('../MsSql/Query');
const { UploadFile } = require('../shared/S3Bucket');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var TitleCertificateModel = require('../Model/TitleCertificateModel');
var PropertyDocumentModel = require('../Model/PropertyDocumentModel');

var CurrentDateTime = require('../shared/CurrentDateTime');

var TitleClearCertificatePdfTemplate = require('../PdfTemplate/TitleClearCertificate');


var TableName = {
    'TitleCertificate': 'tbl_TitleCertificate',
    'TitleCertificateFormat': 'tbl_TitleCertificateFormat',
    'Application': 'tbl_Application'
};

const spName = 'sp_POST_TitleCertificate';
const spUpload = 'sp_POST_PropertyDocument';

const SERVER_ERROR = 'SERVER_ERROR';
const SERVER_ERROR_NOT_FOUND = 'NOT_FOUND';
const NO_CONTENT_ERROR = 'NO_CONTENT';

const DocumentTypeId = 18;
const DocumentSubTypeId = 146;
const TitleClearCertificatePdfFileName = "TitleClearCertificate_{appID}.pdf";

var GETTitleCertificate = (req, res) => {

    var MsSqlQuery = SqlString.format(`SELECT * from ${TableName.TitleCertificate}`);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "All Title Certificate data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching all Title Certificate data from table ${TableName.TitleCertificate}`;;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
        })
}

var POSTTitleCertificate = (req, res) => {

    let model = new modelBuilder().buildModel(req.body, new TitleCertificateModel());

    model.Createdby = req.body.Createdby;
    model.CreatedAt = CurrentDateTime();
    model.IpAddress = null; // this feature is not available yet. when it will available, replace "null" with "req.myCustomAttributeName";

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
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "data successfully Inserted" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Adding Title Certificate data`;
            APIErrorLog(spName, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
        })
}

var GETTitleCertificateFormat = async (req, res) => {
    try {
        var MsSqlQuery = SqlString.format(`SELECT * from ${TableName.TitleCertificateFormat}`);

        let data = await executeQuery(MsSqlQuery);
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "All Title Certificate Format data successfully Fetched" }, new ResponseModel()));
    }
    catch (err) {
        var errMessage = `An error occurred during Fetching all Title Certificate Format data from table ${TableName.TitleCertificateFormat}`;;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
    }
}

var POSTUploadTitleCertificate = async (req, res) => {
    try {
        // make an title celar certificate pdf template using data
        let pdfTemplateRecord = await TitleClearCertificatePdfTemplate.getTitleClearCertificateTemplateRecord();
        let pdfBuffer = await TitleClearCertificatePdfTemplate.makeTitleClearCertificatePdf(pdfTemplateRecord, req.body);

        // upload pdf on s3 bucket 
        var MsSqlQuery = SqlString.format(`Select PropertyID from ${TableName.Application} where AppId = ${req.body.AppID}`);
        let queryData = await executeQuery(MsSqlQuery);

        let propertyId = queryData.recordset[0].PropertyID;
        let fileName = TitleClearCertificatePdfFileName.replace("{appID}", req.body.AppID);

        let result = await UploadFile({ buffer: pdfBuffer }, propertyId, DocumentTypeId, fileName);

        // insert entry in property document table
        let model = new modelBuilder().buildModel(req.body, new PropertyDocumentModel());

        model.PropertyID = propertyId;
        model.FileURL = result.Location;
        model.Key = result.Key;
        model.S3BucketName = result.Bucket;
        model.IpAddress = req.myCustomAttributeName;
        model.CreatedAt = CurrentDateTime();
        model.CreatedBy = req.body.CreatedBy;
        model.DocumentTypeId = DocumentTypeId;
        model.DocumentSubTypeId = DocumentSubTypeId;
        model.Description = 'AutoGenrated Title Clear Certificate';
        model.UserID = req.body.CreatedBy;
        model.FileType = 'PDF';
        model.FileName = fileName;

        let inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        let spResult = await runStoredProcedure(spUpload, inputparams);

        // update documentID in title certificate table
        MsSqlQuery = SqlString.format(`Update ${TableName.TitleCertificate} Set DocumentID = ${spResult.recordset[0].DocumentID} where TitleCertificateID = ${req.body.TitleCertificateID} `);
        let queryDataTitleCerti = await executeQuery(MsSqlQuery);
        if (queryDataTitleCerti.rowsAffected == 1) {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: queryDataTitleCerti.rowsAffected, message: `Records successfully Updated. uploaded document with id ${spResult.recordset[0].DocumentID}` }, new ResponseModel()));
        } else {
            res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: SERVER_ERROR_NOT_FOUND, message: "Records Not found" }, new ResponseModel()));
        }
    }
    catch (err) {
        var errMessage = `An error occurred during uploading title clear certificate pdf and updating database`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
    }
}

var GETTitleCertificatePdf = async (req, res) => {
    try {
        let pdfTemplateRecord = await TitleClearCertificatePdfTemplate.getTitleClearCertificateTemplateRecord();
        let pdfBuffer = await TitleClearCertificatePdfTemplate.makeTitleClearCertificatePdf(pdfTemplateRecord, req.body);
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: pdfBuffer, message: "successfully sent pdf binary data" }, new ResponseModel()));
    }
    catch (err) {
        var errMessage = `An error occurred during getting pdf binary data`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
    }
}


router.get('/api/titlecertificate/view/all', GETTitleCertificate);
router.post('/api/titlecertificate/add', POSTTitleCertificate);
router.get('/api/titlecertificate/format/view/all', GETTitleCertificateFormat);
router.post('/api/titlecertificate/upload', POSTUploadTitleCertificate);
router.get('/api/titlecertificate/view/pdf', GETTitleCertificatePdf);
module.exports = router;