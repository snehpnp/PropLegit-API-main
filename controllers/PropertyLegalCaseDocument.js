var router = require('express').Router();
const SqlString = require('sqlstring');
const sql = require('mssql');
const multer = require('multer');

const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');
const { executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');
const EmailLegalCaseDisposed = require('../EmailTemplate/EmailLegalCaseDisposed.js');
const SMSLegalCaseDisposed = require('../SMSTemplate/SMSLegalCaseDisposed');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

const LegalCaseDocumentTypeId = 19;
const CaseDocumentSubTypeId = 167;
const JudgementDocumentSubTypeId = 168;

const viewLegalcaseDoc = 'view_PropertyDocument';
const tblLegalCase = 'tbl_PropertyLegalCase';


const upload = multer()

var POSTLegalCaseDocument = async (req, res) => {

    var { LegalCaseID } = { ...req.params };
    var { FileName, FileType, Description, CreatedBy } = { ...req.body };
    var { FileExistenceCheck } = { ...req.query };

    if (!req.file || !FileName || !FileType || !LegalCaseID) {
        var errMessage = `Please Upload Document File, Filename, FileType, PropertyID and LegalCaseID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select Top 1 PropertyID from ${tblLegalCase} where LegalCaseID = ?`, [LegalCaseID]);

    try {

        var PropertyID;

        var Result = await executeQuery(MsSqlQuery);

        if (Result.recordset[0]) {
            PropertyID = Result.recordset[0].PropertyID
        }

        var model = await {
            PropertyID,
            LegalCaseID,
            DocumentTypeId: LegalCaseDocumentTypeId,
            DocumentSubTypeId: CaseDocumentSubTypeId,
            Subdirectory: `CaseID_${LegalCaseID}`,
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

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: [DocumentResponce], message: "Legal Case Document Uploaded Successfully!" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Upload Legal Case ${req.params.LegalCaseID}'s Document`;
        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }

}

var GETLegalCaseDocument = async (req, res) => {

    var { LegalCaseID } = await { ...req.params };

    var MsSqlQuery = await SqlString.format(`SELECT * FROM ${viewLegalcaseDoc} WHERE PropertyID = (Select Top 1 PropertyID from ${tblLegalCase} where LegalCaseID = ?) AND LegalCaseID = ? AND DocumentTypeId = 19 AND DocumentSubTypeId = 167`, [LegalCaseID, LegalCaseID]);

    try {

        var Documents = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: Documents.recordset, message: "Leagal Case Document Fetch Successfully!!!" }, new ResponseModel()));


    } catch (err) {
        var errMessage = `An error occurred during Fetch Legal Case ${req.params.LegalCaseID}'s Document`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var GETLegalCaseDecisionDocument = async (req, res) => {

    var { LegalCaseID } = { ...req.params };
    var { FileName, FileType, Description, CreatedBy, DecisionDate, OrderDate } = { ...req.body };
    var { FileExistenceCheck } = { ...req.query };

    if (!req.file || !FileName || !FileType || !LegalCaseID) {
        var errMessage = `Please Upload Document File, Filename, FileType, PropertyID and LegalCaseID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select l.*, v.VillageName, v.TalukaName, v.DistrictName, v.StateName, u.CompanyID, c.CompanyName, lt.LegalCaseTypeName
		from tbl_PropertyLegalcase l
		left join tbl_PropertyLegalcaseTypes lt on lt.LegalCaseTypeID = l.CaseType
		left join  view_PropertyandOtherDetails v on l.PropertyID = v.PropertyID
		left join tbl_UserMaster u on u.UserID = v.CreatedBy
		left join tblCompany_Master c on c.CompanyID = u.CompanyID
		where LegalCaseID =  ?`, [LegalCaseID]);

    try {

        var PropertyID = null;

        var Result = await executeQuery(MsSqlQuery);
        const recordset = Result.recordset[0];

        if (recordset) {
            PropertyID = recordset.PropertyID
        }

        var model = await {
            PropertyID,
            LegalCaseID,
            DocumentTypeId: LegalCaseDocumentTypeId,
            DocumentSubTypeId: JudgementDocumentSubTypeId,
            Subdirectory: `CaseID_${LegalCaseID}`,
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

        MsSqlQuery = await SqlString.format(`Update ${tblLegalCase} SET [Status] = 2, DecisionDate = ?, OrderDate = ?, OrderDocumentID = ? where LegalCaseID = ?`, [DecisionDate, OrderDate, DocumentResponce.DocumentID, LegalCaseID]);

        var updateResult = await executeQuery(MsSqlQuery);

        const Iam = recordset.Iam;

        MsSqlQuery = await SqlString.format(`
        Select LawyerName as [Name], EmailID as [Email], MobileNo as [Mobile], 'Lawyer' as [Type]
        from tbl_PropertyLegalCaseLawyer ll
        left join tblLawyer l on l.LawyerID = ll.LawyerID
        where ll.LegalCaseID = ? AND [LawyerFor] = ?
        Union ALL
        Select [Name],[Email],[Mobile],[Type]
        from tbl_PropertyLegalcasePetitionerAndRespondent
        where LegalCaseID = ? AND [Type] = ?;
        SELECT * FROM tbl_Templates where TemplateID = 20;
        SELECT * FROM tbl_Templates where TemplateID = 21;
        Select FileURL from  ${viewLegalcaseDoc} where DocumentID = ?`, [LegalCaseID, Iam, LegalCaseID, Iam, DocumentResponce.DocumentID]);

        const dataMaster = await executeQuery(MsSqlQuery);
        const result = await dataMaster.recordsets;

        const caseInfo = recordset;
        const senderInfo = result[0];
        const emailTemplateInfo = result[1];
        const SMSTemplateInfo = result[2];
        const DocumentInfo = result[3];

        const emailresult = EmailLegalCaseDisposed(caseInfo, senderInfo, emailTemplateInfo[0], DocumentInfo[0]);

        const smsResuit = SMSLegalCaseDisposed(caseInfo, senderInfo, SMSTemplateInfo[0]);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: [DocumentResponce], message: "Legal Case Decision Document Uploaded Successfully!" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Upload Legal Case ${req.params.LegalCaseID}'s Document`;
        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }

}

router.post('/api/property/legal/Case/Document/:LegalCaseID', upload.single('uploadfile'), POSTLegalCaseDocument);

router.get('/api/property/legal/Case/View/Document/:LegalCaseID', GETLegalCaseDocument);

router.post('/api/property/legal/Case/Decision/Document/:LegalCaseID', upload.single('uploadfile'), GETLegalCaseDecisionDocument);

module.exports = router;