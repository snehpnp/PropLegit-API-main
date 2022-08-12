var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');
const multer = require('multer');
const { UploadFile, checkFile } = require('../shared/S3Bucket');

const GenerateRentInvoice = require('../shared/GenerateRentInvoice');

const upload = multer()

const { executeQuery, runStoredProcedure, UpdateQuery, runStoredProcedureOutput } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var PropertyRentModel = require('../Model/PropertyRentModel')
var PropertyDocumentModel = require('../Model/PropertyDocumentModel');

var CurrentDateTime = require('../shared/CurrentDateTime');
const EmailRentReceipt = require('../EmailTemplate/EmailRentReceipt');
const SMSRentReceipt = require('../SMSTemplate/SMSRentReceipt');
const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');
const GenrateAndStordRentReceipt = require('../PdfTemplate/RentReceiptDocument');
var tblTenant = `tbl_PropertyTenant`;
var tblRent = 'tbl_PropertyRent';
var spUpload = 'sp_POST_PropertyDocument';
var spAddReceipt = `sp_POST_PropertyRentReceipt`;

const DocumentTypeIDForRent = 2;
const DocumentRentSubTypeIdForInvoice = 20;
const DocumentRentSubTypeIdForReceipt = 21;

var GETPropertyRent = (req, res) => {

    var MsSqlQuery = SqlString.format(`Select * from ${tblTenant} where PropertyTenantID = ?;Select * from ${tblRent} where PropertyTenantID = ?;`, [req.params.PropertyTenantID, req.params.PropertyTenantID]);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: {
                    tenantinfo: data.recordset[0],
                    rentinfo: data.recordsets[1]
                }, message: "data successfully Fetched"
            }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Property rent List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

var POSTPropertyUploadInvoice = async (req, res) => {

    const { PropertyRentID } = await { ...req.params };

    if (!req.file || !PropertyRentID) {
        var errMessage = `Please Upload Property rent invoice and pass Property Rent ID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select * from tbl_PropertyTenant 
    where PropertyTenantID = (Select PropertyTenantID from tbl_PropertyRent 
    where  PropertyRentID = ?)`, [PropertyRentID]);

    try {

        const data = await executeQuery(MsSqlQuery);
        var tenant = await data.recordset[0];

        var { PropertyTenantID, RentType, PropertyID } = await { ...tenant };
        var { FileType, Description, CreatedBy, InvoiceDate, InvoiceAmount } = { ...req.body };

        if (RentType == 'Receivable') {
            var errMessage = `You can't Upload Property rent invoice.`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        try {
            var model = await {
                PropertyID,
                DocumentTypeId: DocumentTypeIDForRent,
                DocumentSubTypeId: DocumentRentSubTypeIdForInvoice,
                Subdirectory: `Tenant-${PropertyTenantID}`,
                FileExistenceCheck: 0,
                IpAddress: null,
                FileName: `Invoice_${PropertyRentID}.${FileType}`,
                FileType,
                Description,
                UserID: CreatedBy,
                CreatedBy
            }
            var DocumentResponce = await SaveDocumentGetDocumentID(model, req.file);
            const { FileExistence, DocumentID } = await { ...DocumentResponce };

            if (FileExistence) {
                return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
            }

            var MsSqlQuery = await SqlString.format(`Update ${tblRent} Set InvoiceDocumentID = ?, InvoiceDate = ?, RentAmount = ?  where PropertyRentID = ? `, [DocumentID, InvoiceDate, InvoiceAmount, PropertyRentID]);

            try {

                const uploadinvoice = await executeQuery(MsSqlQuery);

                res.status(200).send(new modelBuilder().buildModel({ status: 200, data: uploadinvoice.rowsAffected, message: "Rent Invoice Successfully Uploaded" }, new ResponseModel()));

            } catch (err) {
                var errMessage = `An error occurred during Adding Property Tenant contract Details`;
                APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            }

        } catch (err) {
            var errMessage = `An error occurred during Upload Property Rent ID ${req.params.PropertyRentID}'s Document`;
            APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }




    } catch (err) {
        var errMessage = `An error occurred during checking of Property rent Type `;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }

}

var POSTPropertyUploadReceipt = async (req, res) => {

    const { PropertyRentID } = { ...req.params }

    if (!req.file || !PropertyRentID) {
        var errMessage = `Please Upload Property rent invoice and pass Property Rent ID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }


    var MsSqlQuery = await SqlString.format(`Select * from tbl_PropertyTenant 
    where PropertyTenantID = (Select PropertyTenantID from tbl_PropertyRent 
    where  PropertyRentID = ?)`, [PropertyRentID])

    try {

        const data = await executeQuery(MsSqlQuery);
        var tenant = data.recordset[0];

        var { PropertyTenantID, RentType, PropertyID, RemainingAdvanceAmount } = { ...tenant };
        var { FileName, FileType, Description, ModifiedBy, AmountFromAdvance } = { ...req.body };
        var { FileExistenceCheck } = { ...req.query };


        if (RentType == 'Receivable') {
            var errMessage = `You can't Upload Property rent receipt.`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        if (AmountFromAdvance > RemainingAdvanceAmount) {
            var errMessage = `You have not that much money in advance balance`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        model = new modelBuilder().buildModel(req.body, new PropertyRentModel());

        model.ModifiedAt = CurrentDateTime();
        model.PropertyRentID = PropertyRentID;
        model.IpAddress = req.myCustomAttributeName;

        var inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        var outputparams = [{
            "name": 'Error_Message',
            "type": sql.NVarChar,
            "value": null
        }]

        try {

            const receiptResult = await runStoredProcedureOutput(spAddReceipt, inputparams, outputparams)
            const { Error_Message } = await receiptResult.output;

            if (Error_Message) {
                return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: Error_Message }, new ResponseModel()));
            }

            const resultData = await receiptResult.recordset[0]
            const NextRentData = await receiptResult.recordsets[1];
            const ALLPaidMonths = await receiptResult.recordsets[2];
            const PaidMonths = await receiptResult.recordsets[3];


            const CsvPromise = () => {

                return new Promise(async (resolve, reject) => {

                    if (ALLPaidMonths.length < 1) resolve([]);

                    var CSVArray = [PropertyRentID];

                    await ALLPaidMonths.filter(e => {

                        if (+e.DueAmount == 0) CSVArray.push(+e.PropertyRentID)
                    })
                    resolve(CSVArray)
                })
            }

            try {

                var model = await {
                    PropertyID,
                    DocumentTypeId: DocumentTypeIDForRent,
                    DocumentSubTypeId: DocumentRentSubTypeIdForReceipt,
                    Subdirectory: `Tenant-${PropertyTenantID}`,
                    FileExistenceCheck: 0,
                    IpAddress: null,
                    FileName: `Receipt_${PropertyRentID}.${FileType}`,
                    FileType,
                    Description,
                    UserID: ModifiedBy,
                    CreatedBy: ModifiedBy
                }
                var DocumentResponce = await SaveDocumentGetDocumentID(model, req.file);
                const { FileExistence, DocumentID } = await { ...DocumentResponce };

                if (FileExistence) {
                    return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
                }

                const CsvPromiseArray = await CsvPromise();

                const CSV_value = await CsvPromiseArray.length > 0 ? CsvPromiseArray.join(', ') : null;

                MsSqlQuery = await SqlString.format(`Update tbl_PropertyRent SET ReceiptDocumentID = ? WHERE PropertyRentID in (${CSV_value});`, [DocumentID]);


                try {

                    const receiptResult = await executeQuery(MsSqlQuery)

                    res.status(200).send(new modelBuilder().buildModel({ status: 200, data: receiptResult.recordsets, message: "Rent Receipt Successfully Uploaded" }, new ResponseModel()));

                } catch (err) {
                    var errMessage = `An error occurred during Adding Property Receipt data`;
                    APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                }

            } catch (err) {

                var errMessage = `An error occurred during Uploading File`;
                APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

            }
        } catch (err) {

            var errMessage = `An error occurred during Adding Property Receipt data`;
            APIErrorLog(spUpload, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }


    } catch (err) {
        var errMessage = `An error occurred during checking of Property rent Type `;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

var POSTPropertyGenerateReceipt = async (req, res) => {
    const { PropertyRentID } = { ...req.params }

    req.body.AmountPay = req.body.AmountPay == null ? 0 : req.body.AmountPay;

    if (!PropertyRentID) {
        var errMessage = `Please pass Property Rent ID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select * from tbl_PropertyTenant 
    where PropertyTenantID = (Select PropertyTenantID from tbl_PropertyRent 
    where  PropertyRentID = ?)`, [PropertyRentID])

    try {

        const data = await executeQuery(MsSqlQuery);
        var tenant = data.recordset[0];

        var { PropertyTenantID, RentType, PropertyID, RemainingAdvanceAmount } = { ...tenant };
        var { FileType, Description, ModifiedBy, AmountFromAdvance } = { ...req.body };

        if (RentType == 'Payable') {
            var errMessage = `You can't Genrate Property rent receipt.`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        if (AmountFromAdvance > RemainingAdvanceAmount) {
            var errMessage = `You have not that much money in advance balance`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        model = new modelBuilder().buildModel(req.body, new PropertyRentModel());

        model.ModifiedAt = CurrentDateTime();
        model.PropertyRentID = PropertyRentID;
        model.IpAddress = req.myCustomAttributeName;

        var inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        var outputparams = [{
            "name": 'Error_Message',
            "type": sql.NVarChar,
            "value": null
        }]
        console.log(model);
        try {

            const receiptResult = await runStoredProcedureOutput(spAddReceipt, inputparams, outputparams)
            const { Error_Message } = await receiptResult.output;

            if (Error_Message) {
                return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: Error_Message }, new ResponseModel()));
            }

            const resultData = await receiptResult.recordset[0]
            const NextRentData = await receiptResult.recordsets[1];
            const ALLPaidMonths = await receiptResult.recordsets[2];
            const PaidMonths = await receiptResult.recordsets[3];

            const { RentStartMonth, RentEndMonth } = await PaidMonths[0];
            var NextRentID = null;

            if (NextRentData[0]) NextRentID = NextRentData[0].PropertyRentID



            try {

                var DocumentResponce = await GenrateAndStordRentReceipt(resultData, ALLPaidMonths);
                const { FileExistence, DocumentID } = await { ...DocumentResponce }

                const CsvPromise = () => {

                    return new Promise(async (resolve, reject) => {

                        if (ALLPaidMonths.length < 1) resolve([]);

                        var CSVArray = [PropertyRentID];

                        await ALLPaidMonths.filter(e => {

                            if (+e.DueAmount == 0) CSVArray.push(+e.PropertyRentID)
                        })
                        resolve(CSVArray)
                    })
                }

                if (FileExistence) {
                    return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
                }

                // const MaxRentID = Math.max(...CSVArray);

                const CsvPromiseArray = await CsvPromise();

                const CSV_value = await CsvPromiseArray.length > 0 ? CsvPromiseArray.join(', ') : null;

                MsSqlQuery = await SqlString.format(`Update tbl_PropertyRent SET ReceiptDocumentID = ? WHERE PropertyRentID in (${CSV_value});`, [DocumentID]);

                try {

                    const UpdatereceiptResult = await executeQuery(MsSqlQuery)
                    const ForInvoice = NextRentID ? await GenerateRentInvoice(NextRentID) : null;

                    const email = await EmailRentReceipt(PropertyRentID, { RentStartMonth, RentEndMonth });
                    const SMS = await SMSRentReceipt(PropertyRentID, { RentStartMonth, RentEndMonth });

                    res.status(200).send(new modelBuilder().buildModel({ status: 200, data: UpdatereceiptResult.recordsets, message: "Rent Receipt Successfully Uploaded" }, new ResponseModel()));

                } catch (err) {

                    var errMessage = `An error occurred during Adding Property Receipt data`;
                    APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                }

            } catch (err) {

                var errMessage = `An error occurred during Uploading File`;
                APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

            }

        } catch (err) {

            var errMessage = `An error occurred during Adding Property Receipt data`;
            APIErrorLog(spUpload, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }


    } catch (err) {
        var errMessage = `An error occurred during checking of Property rent Type `;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}


router.get('/api/property/rent/view/:PropertyTenantID', GETPropertyRent);

router.post('/api/property/rent/Upload/invoice/:PropertyRentID', upload.single('uploadfile'), POSTPropertyUploadInvoice);

router.post('/api/property/rent/Upload/receipt/:PropertyRentID', upload.single('uploadfile'), POSTPropertyUploadReceipt);

router.post('/api/property/rent/generate/receipt/:PropertyRentID', POSTPropertyGenerateReceipt);

module.exports = router;