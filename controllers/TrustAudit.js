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
const TrustAuditModel = require('../Model/TrustAuditModel');
const CurrentDateTime = require('../shared/CurrentDateTime');

const TrustAuditDocumentTypeID = 22;
const AuditDocumentSubTypeID = 172;

const spTrustAudit = 'sp_POST_TrustAudit';
const tblTrustAudit = 'TrustAudit';

var POSTTrustAuditAdd = async(req, res) => {
    const { TrustID, CreatedBy, FileName, FileType, Description, audit } = await {...req.body }
    const { FileExistenceCheck } = {...req.query };

    let model = await new modelBuilder().buildModel(req.body, new TrustAuditModel());
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
        const AddResult = await runStoredProcedure(spTrustAudit, inputparams);
        const ResultData = await AddResult.recordset[0];
        const { AuditID } = await {...ResultData };

        let model = await {
            TrustID,
            DocumentTypeId: TrustAuditDocumentTypeID,
            DocumentSubTypeId: AuditDocumentSubTypeID,
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

        let MsSqlQuery = SqlString.format(`Update ${tblTrustAudit} SET AuditDocumentID = ? where AuditID = ?`, [DocumentID, AuditID]);
        try {
            const result = await executeQuery(MsSqlQuery)
            res.status(200).send(new modelBuilder().buildModel({
                status: 200,
                data: {
                    AuditID,
                    AuditDocumentID: DocumentID
                },
                message: "Audit Added successfully!!"
            }, new ResponseModel()));
        } catch (err) {
            let errMessage = `An error occurred during Insert Audit Document`;
            APIErrorLog(spTrustAudit, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }

    } catch (err) {
        let errMessage = `An error occurred during Insert Audit`;
        APIErrorLog(spTrustAudit, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var GETTrustAuditList = async(req, res) => {
    let { TrustID } = {...req.params };
    TrustID = +TrustID

    if (!TrustID) {
        let errMessage = `please pass numeric values for TrustID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    let MsSqlQuery = await SqlString.format(`Select f.*, d.FileUrl from ${tblTrustAudit} f
    left join view_PropertyDocument d on d.DocumentID = f.AuditDocumentID
    where f.TrustID = ?`, [TrustID]);

    try {
        const Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: Result.recordset,
            message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        let errMessage = `An error occurred during Fetching trust Audit List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.post('/api/trust/add/Audit', upload.single('uploadfile'), POSTTrustAuditAdd);
router.get('/api/trust/Audit/list/:TrustID', GETTrustAuditList);

module.exports = router;