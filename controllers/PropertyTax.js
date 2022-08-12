var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const multer = require('multer');
const { UploadFile, checkFile } = require('../shared/S3Bucket');

const upload = multer()

const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');
const { executeQuery, runStoredProcedure, UpdateQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var PropertyTaxModel = require('../Model/PropertyTaxModel');
var PropertyTaxReceiptModel = require('../Model/PropertyTaxReceiptModel');

var CurrentDateTime = require('../shared/CurrentDateTime');

var spNameFinancialTaxYear = `sp_GET_PropertyTaxByFinancialTaxYear`;
var spAddPropertyTax = `sp_POST_PropertyTax`;
var TableName = 'tbl_PropertyTax';
var ViewTax = 'View_PropertyTax';

const DocumentTypeIDForTAX = 3;
const DocumentSubTypeIdForTaxDemandNotice = 17;
const DocumentSubTypeIdForTaxReceipt = 18;


var GETPropertyTaxCheckByFinancialTaxYear = async (req, res) => {

    var { PropertyID, PropertyTaxTypeID, FinancialTaxYear } = await { ...req.params };

    var model = await {
        PropertyID: +PropertyID,
        PropertyTaxTypeID: +PropertyTaxTypeID,
        FinancialTaxStartYear: +(FinancialTaxYear.split('-')[0]),
        FinancialTaxEndYear: +(FinancialTaxYear.split('-')[1])
    }

    if (!model.PropertyID || !model.PropertyTaxTypeID || !model.FinancialTaxStartYear || !model.FinancialTaxEndYear) {
        var errMessage = `Please Pass valid PropertyID, PropertyTaxTypeID, FinancialTaxStartYear, FinancialTaxEndYear`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    try {

        var inputparams = [];

        await Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        const result = await runStoredProcedure(spNameFinancialTaxYear, inputparams);
        const TaxData = result.recordset;

        if (TaxData.length > 0 && TaxData[0].Error) {
            var errMessage = TaxData[0].Error;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        var output = await {
            LastFinancialTaxYear: TaxData[0] ? TaxData[0].FinancialTaxYear : null,
            LastAmountDue: TaxData[0] ? TaxData[0].AmountDue : null,
            LastPaymentDate: TaxData[0] ? TaxData[0].PaymentDate : null,
            FinancialTaxYear: TaxData[0] ? TaxData[1].FinancialTaxYear : null,
            DueDate: TaxData[0] ? TaxData[0].NextDueDate : null
        }

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: output, message: "data successfully Fetched" }, new ResponseModel()));

    } catch (err) {

        var errMessage = `An error occurred during Property Tax Check By Financial Tax Year `;
        APIErrorLog(spNameFinancialTaxYear, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

var GETPropertyTax = async (req, res) => {

    const { PropertyID, PropertyTaxID } = await { ...req.params };

    var MsSqlQuery = await SqlString.format(`Select * From ${ViewTax} Where 1=1 `);

    if (PropertyID) {
        MsSqlQuery += SqlString.format(' AND PropertyID = ?', [PropertyID])
    } else if (PropertyTaxID) {
        MsSqlQuery += SqlString.format(' AND PropertyTaxID = ?', [PropertyTaxID])
    }

    MsSqlQuery += SqlString.format(' order by PropertyTaxID DESC');
    try {

        const data = await executeQuery(MsSqlQuery);
        const MasterDate = await data.recordset;

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: MasterDate, message: "Tax List successfully Fetched" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching Property Tax List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }

}

var POSTPropertyTax = async (req, res) => {

    const { PropertyID } = await { ...req.params };
    var { FileName, FileType, Description, CreatedBy, FinancialTaxYear, PropertyTaxTypeID } = await { ...req.body };
    const { FileExistenceCheck } = await { ...req.query };

    if (!req.file || !PropertyID) {
        var errMessage = `Please Upload Document File and PropertyID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var model = await {
        PropertyID: +PropertyID,
        PropertyTaxTypeID: +PropertyTaxTypeID,
        FinancialTaxStartYear: FinancialTaxYear ? Number(FinancialTaxYear.split('-')[0]) : null,
        FinancialTaxEndYear: FinancialTaxYear ? Number(FinancialTaxYear.split('-')[1]) : null
    }

    if (!model.PropertyID || !model.PropertyTaxTypeID || !model.FinancialTaxStartYear || !model.FinancialTaxEndYear) {
        var errMessage = `Please Pass valid PropertyTaxType, Financia Tax Year`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    try {

        var model = await {
            PropertyID,
            DocumentTypeId: DocumentTypeIDForTAX,
            DocumentSubTypeId: DocumentSubTypeIdForTaxDemandNotice,
            Subdirectory: FinancialTaxYear,
            FileExistenceCheck: FileExistenceCheck,
            IpAddress: null,
            FileName,
            FileType,
            Description,
            UserID: CreatedBy,
            CreatedBy
        }

        var DocumentResponce = await SaveDocumentGetDocumentID(model, req.file);

        if (DocumentResponce.FileExistence) {
            return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
        }


        const { DocumentID } = await { ...DocumentResponce };

        var TaxYear = FinancialTaxYear;
        var model = await {
            PropertyID: +PropertyID,
            PropertyTaxTypeID: +PropertyTaxTypeID,
            FinancialTaxStartYear: TaxYear ? Number(TaxYear.split('-')[0]) : null,
            FinancialTaxEndYear: TaxYear ? Number(TaxYear.split('-')[1]) : null,
            AmountDue: req.body.AmountDue,
            DueDate: req.body.DueDate,
            DemandNoticeID: DocumentID,
            IpAddress: req.myCustomAttributeName,
            CreatedAt: CurrentDateTime(),
            CreatedBy: CreatedBy
        }
        var inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        try {

            const resultTax = await runStoredProcedure(spAddPropertyTax, inputparams)

            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: resultTax.recordset, message: "Property Tax Data and Demand Notice successfully Uploaded" }, new ResponseModel()));



        } catch (err) {
            var errMessage = `An error occurred during Adding Property Tax`;
            APIErrorLog(spAddPropertyTax, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }




    } catch (err) {
        var errMessage = `An error occurred check during File exsistance.`;
        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var POSTPropertyTaxReceipt = async (req, res) => {

    const { PropertyID, PropertyTaxID } = await { ...req.params };
    var { FileName, FileType, Description, CreatedBy, FinancialTaxYear } = await { ...req.body };
    const { FileExistenceCheck } = await { ...req.query };

    if (!req.file || !PropertyID || !PropertyTaxID) {
        var errMessage = `Please Upload Property Receipt, Property Tax ID and PropertyID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select top 1 FinancialTaxYear from ${TableName} where PropertyTaxID = ?`, [PropertyTaxID]);

    try {

        const data = await executeQuery(MsSqlQuery);
        const MasteData = await data.recordset[0];
        var { FinancialTaxYear } = { ...MasteData };

        if (!FinancialTaxYear) {
            var errMessage = `Property Tax Financial year not found`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        var model = await {
            PropertyID,
            DocumentTypeId: DocumentTypeIDForTAX,
            DocumentSubTypeId: DocumentSubTypeIdForTaxReceipt,
            Subdirectory: FinancialTaxYear,
            FileExistenceCheck: FileExistenceCheck,
            IpAddress: null,
            FileName,
            FileType,
            Description,
            UserID: CreatedBy,
            CreatedBy
        }

        try {

            var DocumentResponce = await SaveDocumentGetDocumentID(model, req.file);

            if (DocumentResponce.FileExistence) {
                return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
            }

            const { DocumentID } = await { ...DocumentResponce };

            var model = await new modelBuilder().buildModel(req.body, new PropertyTaxReceiptModel());

            model.ModifiedAt = CurrentDateTime();
            model.ReceiptID = DocumentID;

            var MsSqlQuery = await UpdateQuery(TableName, model, req.params.PropertyTaxID, 'PropertyTaxID');
            MsSqlQuery += SqlString.format(`Execute sp_AddData_ForTaxReminder @PropertyTaxID = ?`, [req.params.PropertyTaxID]);

            try {

                const data = await executeQuery(MsSqlQuery);

                res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.rowsAffected, message: "Receipt Successfully Uploaded" }, new ResponseModel()));


            } catch (err) {
                var errMessage = `An error occurred during Receipt Data Add`;
                APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            }


        } catch (err) {
            var errMessage = `An error occurred check during File exsistance.`;
            APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }



    } catch (err) {
        var errMessage = `An error occurred during Fetching Property Tax Financial year`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var PUTPropertyTax = async (req, res) => {

    const { PropertyID, PropertyTaxID } = await { ...req.params };
    var { FileName, FileType, Description, CreatedBy, FinancialTaxYear, PropertyTaxTypeID } = await { ...req.body };
    const { FileExistenceCheck } = await { ...req.query };

    if (!req.file || !PropertyID || !PropertyTaxID) {
        var errMessage = `Please Upload Property Demand notice, Property Tax ID and PropertyID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select top 1 FinancialTaxYear from ${TableName} where PropertyTaxID = ?`, [PropertyTaxID]);

    try {

        const data = await executeQuery(MsSqlQuery);
        const MasteData = await data.recordset[0];
        var { FinancialTaxYear } = { ...MasteData };

        if (!FinancialTaxYear) {
            var errMessage = `Property Tax Financial year not found`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        try {

            var model = await {
                PropertyID,
                DocumentTypeId: DocumentTypeIDForTAX,
                DocumentSubTypeId: DocumentSubTypeIdForTaxDemandNotice,
                Subdirectory: FinancialTaxYear,
                FileExistenceCheck: FileExistenceCheck,
                IpAddress: null,
                FileName,
                FileType,
                Description,
                UserID: CreatedBy,
                CreatedBy
            }

            var DocumentResponce = await SaveDocumentGetDocumentID(model, req.file);

            if (DocumentResponce.FileExistence) {
                return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
            }


            const { DocumentID } = await { ...DocumentResponce };

            var model = new modelBuilder().buildModel(req.body, new PropertyTaxModel());
            model.FinancialTaxYear = FinancialTaxYear;

            model.ModifiedAt = CurrentDateTime();
            model.DemandNoticeID = DocumentID;

            try {

                const MsSqlQuery = await UpdateQuery(TableName, model, PropertyTaxID, 'PropertyTaxID');
                const data = await executeQuery(MsSqlQuery);

                res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.rowsAffected, message: "Tax Updated Successfully!!" }, new ResponseModel()));

            } catch (err) {
                var errMessage = `An error occurred during Add receipt in Property tax`;
                APIErrorLog('Upload', err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            }


        } catch (err) {
            var errMessage = `An error occurred check during File exsistance.`;
            APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }


    } catch (err) {
        var errMessage = `An error occurred during Fetching Property Tax Financial year`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var DELETEPropertyTax = async (req, res) => {

    var { PropertyTaxID } = await { ...req.params };

    var MsSqlQuery = SqlString.format(`UPDATE ${TableName} SET IsDelete = 1 where PropertyTaxID = ?`, [PropertyTaxID]);

    try {

        const data = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.rowsAffected, message: "Data successfully Updated" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Deleting Property Tax `;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.get('/api/property/LastFinancialTaxYear/:PropertyID/:PropertyTaxTypeID/:FinancialTaxYear', GETPropertyTaxCheckByFinancialTaxYear)

router.get('/api/property/:PropertyID/tax/list', GETPropertyTax);
router.get('/api/property/tax/view/:PropertyTaxID', GETPropertyTax);

router.post('/api/property/:PropertyID/tax/add', upload.single('uploadfile'), POSTPropertyTax);
router.put('/api/property/:PropertyID/tax/update/:PropertyTaxID', upload.single('uploadfile'), PUTPropertyTax)

router.post('/api/property/:PropertyID/tax/:PropertyTaxID/receipt/upload', upload.single('uploadfile'), POSTPropertyTaxReceipt);

router.delete('/api/property/tax/delete/:PropertyTaxID', DELETEPropertyTax);

module.exports = router;