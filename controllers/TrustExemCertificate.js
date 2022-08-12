var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const multer = require('multer');
const upload = multer()

const { executeQuery, runStoredProcedure } = require('../MsSql/Query');
const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
const TrustExemCertificateModel = require('../Model/TrustExemCertificateModel');
const CurrentDateTime = require('../shared/CurrentDateTime');

const TrustExemCertificateDocumentTypeID = 23;
const ExemCertificateDocumentSubTypeID = 173;

const spTrustExemCertificate = 'sp_POST_TrustExemCertificate';
const tblTrustExemCertificate = 'TrustExemCertificate';

var POSTTrustExemCertificateAdd = async(req, res) => {
    const { TrustID, CreatedBy, FileName, FileType, Description, audit } = await {...req.body }
    const { FileExistenceCheck } = {...req.query };

    let model = await new modelBuilder().buildModel(req.body, new TrustExemCertificateModel());
    model.IpAddress = await req.myCustomAttributeName;
    model.CreatedAt = await CurrentDateTime();
    model.audit = await audit
    let inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {
        const AddResult = await runStoredProcedure(spTrustExemCertificate, inputparams);
        const ResultData = await AddResult.recordset[0];
        const { ExemptionID } = await {...ResultData };
        let model = await {
            TrustID,
            DocumentTypeId: TrustExemCertificateDocumentTypeID,
            DocumentSubTypeId: ExemCertificateDocumentSubTypeID,
            Subdirectory: null,
            FileExistenceCheck: FileExistenceCheck,
            IpAddress: null,
            FileName,
            FileType,
            Description,
            UserID: CreatedBy,
            CreatedBy
        }
        let DocumentResponce = await SaveDocumentGetDocumentID(model, req.file);
        if (DocumentResponce.FileExistence) {
            return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
        }
        const { DocumentID } = await {...DocumentResponce };
        let MsSqlQuery = SqlString.format(`Update ${tblTrustExemCertificate} SET CertificateDocumentID = ? where ExemptionID = ?`, [DocumentID, ExemptionID]);
        try {
            const result = await executeQuery(MsSqlQuery)
            res.status(200).send(new modelBuilder().buildModel({
                status: 200,
                data: {
                    ExemptionID,
                    ExamDocumentID: DocumentID
                },
                message: "Exemption Certificate Added successfully!!"
            }, new ResponseModel()));
        } catch (err) {
            let errMessage = `An error occurred during Update Document ID`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }
    } catch (err) {
        let errMessage = `An error occurred during Insert Fund`;
        APIErrorLog(spTrustExemCertificate, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var GETTrustExemCertificateList = async(req, res) => {
    let { TrustID } = {...req.params };
    TrustID = +TrustID

    if (!TrustID) {
        let errMessage = `please pass numeric values for TrustID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    let MsSqlQuery = await SqlString.format(`Select f.*, d.FileUrl from ${tblTrustExemCertificate} f
    left join view_PropertyDocument d on d.DocumentID = f.CertificateDocumentID
    where f.TrustID = ?`, [TrustID]);

    try {
        const Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: Result.recordset,
            message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        let errMessage = `An error occurred during Fetching trust Exem Certificate List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.post('/api/trust/add/ExemCertificate', upload.single('uploadfile'), POSTTrustExemCertificateAdd);
router.get('/api/trust/ExemCertificate/list/:TrustID', GETTrustExemCertificateList);

module.exports = router;