var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const multer = require('multer');
const upload = multer()

const { runStoredProcedureTblinput, executeQuery, runStoredProcedure } = require('../MsSql/Query');
const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');
const WelcomeTrustEmail = require('../EmailTemplate/WelcomeTrustEmail');
const SMSForMeeting = require('../SMSTemplate/SMSMeeting');
var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
const CurrentDateTime = require('../shared/CurrentDateTime');
const EmailMeeting = require('../EmailTemplate/EmailMeeting');

const TrustDocumentTypeID = 20;
const AgendaDocumentSubTypeID = 169;
const MOMDocumentSubTypeID = 170;

const spTrustMeeting = 'sp_POST_TrustMeeting';
const sp_Meeting_Process = 'sp_POST_TrustMeeting_Process';
const ViewMeeting = 'View_TrustMeeting';
const tblMeeting = 'TrusteesMeeting';

var POSTTrustMeetingAdd = async(req, res) => {

    var { TrustID } = await {...req.params };
    const { MeetingTitle, MeetingdateTime, venue, CreatedBy, FileName, FileType, Description } = await {...req.body }
    const { FileExistenceCheck } = {...req.query };
    TrustID = +TrustID

    if (!TrustID) {
        var errMessage = `please pass numeric values for TrustID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var model = {
        TrustID,
        MeetingTitle,
        MeetingdateTime,
        venue,
        CreatedBy,
        IpAddress: req.myCustomAttributeName,
        CreatedAt: CurrentDateTime()
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
        const AddResult = await runStoredProcedure(spTrustMeeting, inputparams);
        const ResultData = await AddResult.recordset[0];
        const { TrustID, MeetingID, Error, TrusteeUserID } = await {...ResultData };

        if (Error) {
            var errMessage = Error;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }
        var model = await {
            TrustID,
            DocumentTypeId: TrustDocumentTypeID,
            DocumentSubTypeId: AgendaDocumentSubTypeID,
            Subdirectory: `Meeting_ID_${MeetingID}`,
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

        const { DocumentID } = await {...DocumentResponce };

        model = {
            TrustID,
            TrusteeUserID,
            MeetingID,
            AgendaDocumentID: DocumentID
        }

        inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        try {

            const MeetingResult = await runStoredProcedure(sp_Meeting_Process, inputparams)
                // console.log('FromUsers: ', MeetingResult.recordsets);
            const MeetingData = await MeetingResult.recordsets;

            const FromUsers = await MeetingData[0];

            const ToUsers = await MeetingData[1];
            const MeetingInfo = await MeetingData[2];
            // console.log('MeetingInfo: ', MeetingInfo);
            const Emailtemplate = await MeetingData[3];
            const SMStemplate = await MeetingData[4];

            const EmailResult = await EmailMeeting(MeetingInfo[0], FromUsers[0], ToUsers, Emailtemplate[0])
            const SMSResult = await SMSForMeeting(ToUsers, SMStemplate[0], MeetingInfo[0])
            res.status(200).send(new modelBuilder().buildModel({
                status: 200,
                data: ResultData,
                message: "Meeting successfully arranged!!"
            }, new ResponseModel()));

        } catch (err) {
            console.log('err: ', err);
            var errMessage = `An error occurred during Insert Trust Meeting`;
            APIErrorLog(sp_Meeting_Process, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }
    } catch (err) {
        console.log('err: ', err);
        var errMessage = `An error occurred during Insert Trust Meeting`;
        APIErrorLog(spTrustMeeting, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var GETTrustMeetingList = async(req, res) => {

    var { TrustID } = {...req.params };
    TrustID = +TrustID

    if (!TrustID) {
        var errMessage = `please pass numeric values for TrustID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select * from ${ViewMeeting} where TrustID = ?`, [TrustID]);

    try {

        const Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: Result.recordset,
            message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching trust Meeting List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}

var PUTTrustMeeting = async(req, res) => {

    var { MeetingID } = {...req.params };
    const { TotalTimeOfMeetingInMinutes, CreatedBy, FileName, FileType, Description } = await {...req.body }
    const { FileExistenceCheck } = {...req.query };
    MeetingID = +MeetingID

    if (!MeetingID) {
        var errMessage = `please pass numeric values for MeetingID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select * from ${ViewMeeting} where MeetingID = ?;
     Update ${tblMeeting} SET TotalTimeOfMeetingInMinutes = ?, IsMeetingCompleted = 1 where MeetingID = ?;
     insert into TrusteesMeeting_history (MeetingID,TotalTimeOfMeetingInMinutes,IsMeetingCompleted,HistoryStatus) values (${MeetingID},${TotalTimeOfMeetingInMinutes},1,'complete')`, [MeetingID, TotalTimeOfMeetingInMinutes, MeetingID]);

    try {

        const Result = await executeQuery(MsSqlQuery);
        const MasterData = await Result.recordset[0];
        const { TrustID } = {...MasterData };
        console.log('TrustID: ', TrustID);

        if (!req.file) {
            return res.status(200).send(new modelBuilder().buildModel({
                status: 200,
                data: [],
                message: "Meeting  Successfully updated!!"
            }, new ResponseModel()));
        }
        console.log('after')
        var model = await {
            TrustID,
            DocumentTypeId: TrustDocumentTypeID,
            DocumentSubTypeId: MOMDocumentSubTypeID,
            Subdirectory: `Meeting_ID_${MeetingID}`,
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

        const { DocumentID } = await {...DocumentResponce };

        model = {
            TrustID,
            MeetingID,
            MOMDocumentID: DocumentID
        }

        inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        try {

            const MeetingResult = await runStoredProcedure(sp_Meeting_Process, inputparams)
            const MeetingData = await MeetingResult.recordsets;
            const FromUsers = await MeetingData[0];
            const ToUsers = await MeetingData[1];
            const MeetingInfo = await MeetingData[2];
            const Emailtemplate = await MeetingData[3];
            const SMStemplate = await MeetingData[4];

            const EmailResult = await EmailMeeting(MeetingInfo[0], FromUsers[0], ToUsers, Emailtemplate[0])
            const SMSResult = await SMSForMeeting(ToUsers, SMStemplate[0], MeetingInfo[0])
            res.status(200).send(new modelBuilder().buildModel({
                status: 200,
                data: [],
                message: "Meeting Successfully updated!!"
            }, new ResponseModel()));

        } catch (err) {

            var errMessage = `An error occurred during Insert After Meeting Data`;
            APIErrorLog(sp_Meeting_Process, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }

    } catch (err) {

        var errMessage = `An error occurred during Fetching Add After Meeting Data`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }

}

var DELETETrustMeeting = async(req, res) => {

    var { MeetingID } = {...req.params };
    MeetingID = +MeetingID

    if (!MeetingID) {
        var errMessage = `please pass numeric values for MeetingID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    model = {
        MeetingID,
        IsMeetingCancel: 1,
        CreatedAt: CurrentDateTime()
    }

    inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {

        const MeetingResult = await runStoredProcedure(sp_Meeting_Process, inputparams)
        const MeetingData = await MeetingResult.recordsets;
        const FromUsers = await MeetingData[0];
        const ToUsers = await MeetingData[1];
        const MeetingInfo = await MeetingData[2];
        const Emailtemplate = await MeetingData[3];
        const SMStemplate = await MeetingData[4];


        const EmailResult = await EmailMeeting(MeetingInfo[0], FromUsers[0], ToUsers, Emailtemplate[0])
        const SMSResult = await SMSForMeeting(ToUsers, SMStemplate[0], MeetingInfo[0])
        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: [],
            message: "Meeting Successfully Cancelled!!"
        }, new ResponseModel()));

    } catch (err) {
        console.log('err: ', err);
        var errMessage = `An error occurred during Meeting Cancel`;
        APIErrorLog(sp_Meeting_Process, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}

var updateMeeting = async(req, res) => {
    // var { MeetingID } = { ...req.params };
    var { MeetingdateTime, FileName, FileType, CreatedBy, Description, MeetingID, venue } = await {...req.body }
    const { FileExistenceCheck } = {...req.query };
    MeetingID = +MeetingID
    CreatedBy = +CreatedBy
    if (!MeetingID) {
        var errMessage = `please pass numeric values for MeetingID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select * from ${ViewMeeting} where MeetingID = ?;
     Update ${tblMeeting} SET MeetingdateTime = ?, venue = ?,IsMeetingCompleted = 2 where MeetingID = ?;
    `, [MeetingID, MeetingdateTime, venue, MeetingID]);
    try {
        const Result = await executeQuery(MsSqlQuery);
        const MasterData = await Result.recordset[0];
        const { TrustID } = {...MasterData };
        const historyquery = await SqlString.format(`Insert into TrusteesMeeting_history (MeetingID,MeetingdateTime,venue,IsMeetingCompleted,HistoryStatus)
    VALUES (${MeetingID},'${MeetingdateTime}','${venue}',2,'reshedule')`)
        const Resulth = await executeQuery(historyquery);
        if (!req.file) {
            return res.status(200).send(new modelBuilder().buildModel({
                status: 200,
                data: [],
                message: "Meeting infomation Successfully updated!!"
            }, new ResponseModel()));
        }
        var model = await {
            TrustID,
            DocumentTypeId: TrustDocumentTypeID,
            DocumentSubTypeId: AgendaDocumentSubTypeID,
            Subdirectory: `Meeting_ID_${MeetingID}`,
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

        const { DocumentID } = await {...DocumentResponce };

        model = {
            TrustID,
            MeetingID,
            AgendaDocumentID: DocumentID
        }

        inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        try {
            const MeetingResult = await runStoredProcedure(sp_Meeting_Process, inputparams)
            const MeetingData = await MeetingResult.recordsets;
            const FromUsers = await MeetingData[0];
            const ToUsers = await MeetingData[1];
            const MeetingInfo = await MeetingData[2];
            const Emailtemplate = await MeetingData[3];
            const SMStemplate = await MeetingData[4];
            var getetemMsSqlQuery = await SqlString.format(`SELECT * from tbl_Templates WHERE TemplateID IN (33,36)`);
            const etempResult = await executeQuery(getetemMsSqlQuery);
            // console.log('etempResult: ', etempResult.recordsets);
            const EmailResult = await EmailMeeting(MeetingInfo[0], FromUsers[0], ToUsers, etempResult.recordsets[0][0])
            const SMSResult = await SMSForMeeting(ToUsers, etempResult.recordsets[0][1], MeetingInfo[0])
            res.status(200).send(new modelBuilder().buildModel({
                status: 200,
                data: [],
                message: "Meeting infomation Successfully updated!!"
            }, new ResponseModel()));

        } catch (err) {
            // console.log('err: ', MeetingResult.recordsets);

            var errMessage = `An error occurred during update After Meeting Data`;
            APIErrorLog(sp_Meeting_Process, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }
    } catch (err) {
        // console.log('err: ', err);
        var errMessage = `An error occurred during update After Meeting Data`;
        APIErrorLog(sp_Meeting_Process, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}
router.post('/api/trust/add/meeting/:TrustID', upload.single('uploadfile'), POSTTrustMeetingAdd);
router.put('/api/trust/meeting/:MeetingID', upload.single('uploadfile'), PUTTrustMeeting);
router.post('/api/trust/meeting/update', upload.single('uploadfile'), updateMeeting)
router.get('/api/trust/meeting/list/:TrustID', GETTrustMeetingList);
router.delete('/api/trust/meeting/:MeetingID', DELETETrustMeeting);

module.exports = router;