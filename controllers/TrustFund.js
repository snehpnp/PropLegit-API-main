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
const TrustFundModel = require('../Model/TrustFundModel');
const CurrentDateTime = require('../shared/CurrentDateTime');

const TrustFundDocumentTypeID = 21;
const FundDocumentSubTypeID = 171;

const spTrustFund = 'sp_POST_TrustFund';
const tblTrustFunds = 'TrustFunds';

var POSTTrustFundAdd = async (req, res) => {

    const { TrustID, CreatedBy, FileName, FileType, Description } = await { ...req.body }
    const { FileExistenceCheck } = { ...req.query };

    var model = await new modelBuilder().buildModel(req.body, new TrustFundModel());
    model.IpAddress = await req.myCustomAttributeName;
    model.CreatedAt = await CurrentDateTime();

    var inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {
        const AddResult = await runStoredProcedure(spTrustFund, inputparams);
        const ResultData = await AddResult.recordset[0];
        const { FundID } = await { ...ResultData };

        var model = await {
            TrustID,
            DocumentTypeId: TrustFundDocumentTypeID,
            DocumentSubTypeId: FundDocumentSubTypeID,
            Subdirectory: null,
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

        const { DocumentID } = await { ...DocumentResponce };

        var MsSqlQuery = SqlString.format(`Update ${tblTrustFunds} SET FundDocumentID = ? where FundID = ?`, [DocumentID, FundID])

        try {

            const MeetingResult = await executeQuery(MsSqlQuery)

            res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: {
                    FundID,
                    FundDocumentID: DocumentID
                }, message: "Fund Added successfully!!"
            }, new ResponseModel()));

        } catch (err) {
            var errMessage = `An error occurred during Insert Fund`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }
    } catch (err) {
        var errMessage = `An error occurred during Insert Fund`;
        APIErrorLog(spTrustFund, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var GETTrustFundList = async (req, res) => {

    var { TrustID } = { ...req.params };
    TrustID = +TrustID

    if (!TrustID) {
        var errMessage = `please pass numeric values for TrustID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select f.*, d.FileUrl from ${tblTrustFunds} f
    left join view_PropertyDocument d on d.DocumentID = f.FundDocumentID
    where f.TrustID = ?`, [TrustID]);

    try {

        const Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: Result.recordset, message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching trust Fund List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}

router.post('/api/trust/add/Fund', upload.single('uploadfile'), POSTTrustFundAdd);
router.get('/api/trust/Fund/list/:TrustID', GETTrustFundList);

module.exports = router;