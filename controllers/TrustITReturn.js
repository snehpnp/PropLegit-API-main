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
const TrustITReturnModel = require('../Model/TrustITReturnModel');
const CurrentDateTime = require('../shared/CurrentDateTime');

const TrustITReturnDocumentTypeID = 24;
const ITReturnAckDocumentSubTypeID = 174; // ACK Document
const ITReturnOrderDocumentSubTypeID = 175; // order Document

const spTrustITReturn = 'sp_POST_TrustITReturn';
const tblTrustITReturn = 'TrustITReturn';

var POSTTrustITReturnAdd = async(req, res) => {
    console.log(req.files)
    const { uploadReturnAck, uploadReturnOrder } = req.files;

    const DocuploadReturnAck = await uploadReturnAck ? uploadReturnAck[0] : null;
    const DocuploadReturnOrder = await uploadReturnOrder ? uploadReturnOrder[0] : null;

    if ((DocuploadReturnAck && DocuploadReturnAck.mimetype !== 'application/pdf') ||
        (DocuploadReturnOrder && DocuploadReturnOrder.mimetype !== 'application/pdf')) {

        let errMessage = `please Upload only PDF document`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    const { TrustID, CreatedBy } = await {...req.body }

    if (!+TrustID) {
        let errMessage = `please pass numeric values for TrustID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    try {

        let model = await new modelBuilder().buildModel(req.body, new TrustITReturnModel());
        model.IpAddress = await req.myCustomAttributeName;
        model.CreatedAt = await CurrentDateTime();

        let inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });
        const mssqlquery = await SqlString.format(`Select Count(*) as Count from TrustITReturn where  TrustID = ${TrustID} AND FinYear = '${req.body.FinYear}'`)
        const run = await executeQuery(mssqlquery);
        if (run.recordset[0].Count > 0) {
            let errMessages = `This Financial Year is already exists!!!`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessages }, new ResponseModel()));
        }
        const AddResult = await runStoredProcedure(spTrustITReturn, inputparams);
        const ResultData = await AddResult.recordset[0];
        const { ITReturnID } = await {...ResultData };

        try {

            const ReturnAckDocumentID = await fnuploadReturnAck({
                TrustID,
                CreatedBy,
                FileName: `ReturnAck_${ITReturnID}.PDF`,
                FileType: 'PDF',
                Description: `Trust IT Return ACK Document`,
                SubTypeID: ITReturnAckDocumentSubTypeID
            }, DocuploadReturnAck);

            const ReturnOrderDocumentID = await fnuploadReturnAck({
                TrustID,
                CreatedBy,
                FileName: `ReturnOrder_${ITReturnID}.PDF`,
                FileType: 'PDF',
                Description: `Trust IT Return Order Document`,
                SubTypeID: ITReturnOrderDocumentSubTypeID
            }, DocuploadReturnOrder)


            let MsSqlQuery = await SqlString.format(`Update ${tblTrustITReturn} SET ReturnAckDocumentID = ?, ReturnOrderDocumentID = ? where ITReturnID = ?`, [ReturnAckDocumentID, ReturnOrderDocumentID, ITReturnID]);
            try {

                const result = await executeQuery(MsSqlQuery)
                res.status(200).send(new modelBuilder().buildModel({
                    status: 200,
                    data: {
                        ITReturnID,
                        ReturnAckDocumentID,
                        ReturnOrderDocumentID
                    },
                    message: "IT Return  Added successfully!!"
                }, new ResponseModel()));
            } catch (err) {
                console.log('err: ', err);
                let errMessage = `An error occurred during Update Document ID`;
                APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            }


        } catch (err) {
            console.log('err: ', err);
            let errMessage = `An error occurred during Upload Document`;
            APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }

    } catch (err) {
        console.log('err: ', err);
        let errMessage = `An error occurred during Insert IT Returns data`;
        APIErrorLog(spTrustITReturn, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

const fnuploadReturnAck = async(FileData, File) => {
    console.log('FileData: ', FileData);

    return new Promise(async(resolve, reject) => {

        try {

            if (!File) resolve(null)

            const { TrustID, CreatedBy, FileName, FileType = 'PDF', Description, SubTypeID } = await {...FileData }

            let model = await {
                TrustID,
                DocumentTypeId: TrustITReturnDocumentTypeID,
                DocumentSubTypeId: SubTypeID,
                Subdirectory: null,
                FileExistenceCheck: 0,
                IpAddress: null,
                FileName,
                FileType,
                Description,
                UserID: CreatedBy,
                CreatedBy
            }
            let DocumentResponce = await SaveDocumentGetDocumentID(model, File);
            if (DocumentResponce.FileExistence) {
                return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
            }

            resolve(DocumentResponce.DocumentID);

        } catch (err) {
            reject(err)
        }
    })
}

var GETTrustITReturnList = async(req, res) => {
    let { TrustID } = {...req.params };
    TrustID = +TrustID

    if (!TrustID) {
        let errMessage = `please pass numeric values for TrustID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    let MsSqlQuery = await SqlString.format(`Select * from view_TrustITReturn
    Where TrustID = ? order by ITReturnID desc`, [TrustID]);

    try {
        const Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: Result.recordset,
            message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        let errMessage = `An error occurred during Fetching trust IT return List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}
var GETLAWYERLIST = async(req, res) => {
    let MsSqlQuery = await SqlString.format(`Select Name,TrusteeUserID from TrusteeUsers where TrusteeUsertypeID = ?`, [req.params.id]);
    try {
        const Result = await executeQuery(MsSqlQuery);
        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: Result.recordset,
            message: "data successfully Fetched"
        }, new ResponseModel()));
    } catch (error) {
        let errMessage = `An error occurred during Fetching trust IT return Lawyer`;
        APIErrorLog(MsSqlQuery, error, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}
router.get('/api/trust/user/:id', GETLAWYERLIST)

router.post('/api/trust/add/ITReturn', upload.fields([{
        name: 'uploadReturnAck'
    },
    {
        name: 'uploadReturnOrder'
    }
]), POSTTrustITReturnAdd);
router.get('/api/trust/ITReturn/list/:TrustID', GETTrustITReturnList);

module.exports = router;