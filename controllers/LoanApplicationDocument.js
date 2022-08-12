var router = require('express').Router();
const SqlString = require('sqlstring');
const sql = require('mssql');
const multer = require('multer');
const { merge } = require('merge-pdf-buffers');

const { runStoredProcedure, executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

const spPropertyDocumentReviewed = 'sp_PUT_PropertyDocumentReviewed';
const fnPropertyDocument = 'dbo.ufTableOfPropertyDocumentByAppID';

var upload = multer({
    fileFilter: (req, file, cb) => {

        if (file.mimetype == "application/pdf") {
            cb(null, true);
        } else {
            cb(null, false);
            // return cb(new Error('Only .pdf format allowed!'));
        }
    }
}).array("uploadfile")

var GETLoanApplicationDocument = (req, res) => {

    var { DocumentStatus } = { ...req.query }

    var MsSqlQuery = SqlString.format(`Select * from ${fnPropertyDocument}(?) where 1=1 `, [req.params.AppID])
    console.log(MsSqlQuery);
    if (DocumentStatus) {
        MsSqlQuery += SqlString.format(` AND Status = ?`, [DocumentStatus])
    }

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: data.recordset, message: "data successfully Fetched"
            }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Loan Documents `;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var PUTLoanPropertyDocumentReviewed = (req, res) => {

    var model = {
        PropertyID: req.params.PropertyID,
        DocumentID: req.params.DocumentID
    }

    var inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    runStoredProcedure(spPropertyDocumentReviewed, inputparams)
        .then(result => {

            res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: result.rowsAffected, message: "Document Status Successfully Updated!!"
            }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Change Property Document Status `;
            APIErrorLog(spPropertyDocumentReviewed, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

const POSTLoanPropertyDocumentMultipleUpload = async (req, res) => {

    const { PropertyID } = await { ...req.params };
    const { DocumentTypeId, DocumentSubTypeId, CreatedBy, FileName } = await { ...req.body };
    const { files } = await { ...req }

    if (!+PropertyID || +PropertyID < 1) {
        var errMessage = `please pass numeric values for Property ID!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    if (files < 1) {
        var errMessage = `please upload least 1 file.`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    try {

        var buffArray = [];

        await files.forEach(async (ele) => {
            buffArray.push(ele.buffer)
        })

        const mergedpdfBuffer = await merge([...buffArray]);


        var model = await {
            PropertyID: PropertyID,
            DocumentTypeId: DocumentTypeId,
            DocumentSubTypeId: DocumentSubTypeId,
            FileExistenceCheck: 0,
            IpAddress: null,
            FileName: `${FileName}.PDF`,
            FileType: `PDF`,
            Description: `Auto Generated 712 Document`,
            UserID: CreatedBy,
            CreatedBy
        }
        var response = await SaveDocumentGetDocumentID(model, { buffer: mergedpdfBuffer })
        const { DocumentID } = await { ...response };

        res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: { DocumentID }, message: "Document Successfully Merged and Uploaded"
        }, new ResponseModel()));

    } catch (err) {

        var errMessage = `An error occurred during Upload multiple 712 document for PropertyID ${PropertyID}`;
        APIErrorLog('Upload document', err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }








}



router.get('/api/loan/application/Documents/AppID/:AppID', GETLoanApplicationDocument);

router.put('/api/loan/property/document/reviewed/:PropertyID/:DocumentID', PUTLoanPropertyDocumentReviewed);

router.post('/api/loan/property/:PropertyID/document/multiple/upload', upload, POSTLoanPropertyDocumentMultipleUpload);

module.exports = router;