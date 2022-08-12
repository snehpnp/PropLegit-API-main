var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery, runStoredProcedure, UpdateQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var PublicNoticeModel = require('../Model/PublicNoticeModel')
var PublicNoticeResponseModel = require('../Model/PublicNoticeResponseModel')

var CurrentDateTime = require('../shared/CurrentDateTime');

const SMSPublicNoticeIssued = require('../SMSTemplate/PublicNoticeIssued');
const EmailPublicNoticeIssued = require('../EmailTemplate/PublicNoticeIssued');

var TableName = {
    'Language': 'tbl_Language',
    'PublicNoticeFormat': 'tbl_PublicNoticeFormat',
    'NewsPaper': 'tblNewspaper',
    'ApplicationPublicNotice': 'tbl_ApplicationPublicNotice',
    'Application': 'tbl_Application',
    'Applicant': 'tbl_Applicant',
    'UserMaster': 'tbl_usermaster',
    'PublicNoticeResponse': 'tbl_PubliceNoticeResponce'
};

const spName = {
    'ApplicationPublicNotice': 'sp_POST_ApplicationPublicNotice',
    'PublicNoticeResponse': 'sp_POST_PubliceNoticeResponce'
}

const SERVER_ERROR = 'SERVER_ERROR';
const SERVER_ERROR_NOT_FOUND = 'Not_Found';
const NO_CONTENT_ERROR = 'NO_CONTENT';
const INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR';


var GETLanguage = (req, res) => {

    var MsSqlQuery = SqlString.format(`SELECT * from ${TableName.Language}`);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "All languages data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching all language data from table ${TableName.Language}`;;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
        })
}

var GETNewsPaper = (req, res) => {

    var MsSqlQuery = SqlString.format(`SELECT * from ${TableName.NewsPaper}`);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "All News Paper data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching all News Paper data from table ${TableName.NewsPaper}`;;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
        })
}

var GETPublicNoticeFormat = (req, res) => {

    var MsSqlQuery = SqlString.format(`SELECT * from ${TableName.PublicNoticeFormat}`);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "All Public Notice data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching all Public Notice data from table ${TableName.PublicNoticeFormat}`;;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
        })
}

var POSTPublicNotice = (req, res) => {

    var model = new modelBuilder().buildModel(req.body, new PublicNoticeModel());

    model.CreatedBy = req.body.CreatedBy;
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

    runStoredProcedure(spName.ApplicationPublicNotice, inputparams)
        .then(result => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "data successfully Inserted" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Adding Public Notice data`;
            APIErrorLog(spName.ApplicationPublicNotice, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
        })
}

var GETPublicNotice = (req, res) => {

    var MsSqlQuery = SqlString.format(`SELECT * from ${TableName.ApplicationPublicNotice}`);

    if (req.params.publicNoticeId) {
        MsSqlQuery += SqlString.format(' where ApplicationNoticeID =?', [req.params.publicNoticeId])
    }

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: `Public Notice data successfully Fetched` }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Public Notice data from table ${TableName.PublicNoticeFormat}`;;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
        })
}

var PUTPublicNotice = (req, res) => {

    var model = new modelBuilder().buildModel(req.body, new PublicNoticeModel());

    model.ModifiedAt = CurrentDateTime();
    model.ModifiedBy = req.body.ModifiedBy;

    UpdateQuery(TableName.ApplicationPublicNotice, model, req.params.publicNoticeId, 'ApplicationNoticeID')
        .then(MsSqlQuery => {

            executeQuery(MsSqlQuery)
                .then(data => {
                    if (data.rowsAffected == 1) {
                        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.rowsAffected, message: "Records successfully Updated" }, new ResponseModel()));
                    } else {
                        res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: SERVER_ERROR_NOT_FOUND, message: "Records Not found" }, new ResponseModel()));
                    }

                })
                .catch(err => {
                    var errMessage = `An error occurred during Updating Public Notice Data`;
                    APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
                })

        })
        .catch(err => {
            var errMessage = err;
            APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: NO_CONTENT_ERROR, error: errMessage }, new ResponseModel()));
        })
}

var PUTUpdatePublishStatus = async (req, res) => {
    let errMessages = [];

    let IsPublished = req.body.IsPublished;
    let ApplicationNoticeID = req.params.publicNoticeId;

    let MsSqlQuery = SqlString.format(`UPDATE ${TableName.ApplicationPublicNotice} SET IsPublished=${IsPublished} WHERE ApplicationNoticeID=${ApplicationNoticeID}`);

    try {
        let result = await executeQuery(MsSqlQuery);
        if (result.rowsAffected == 1) {
            try {
                // get Application ID and Bank manager ID from tbl_ApplicationPublicNOtice
                MsSqlQuery = SqlString.format(`SELECT AppID, CreatedBy from ${TableName.ApplicationPublicNotice}`);
                if (req.params.publicNoticeId) {
                    MsSqlQuery += SqlString.format(' where ApplicationNoticeID =?', [req.params.publicNoticeId])
                }
                let data = await executeQuery(MsSqlQuery);
                let applicationId = data.recordset[0].AppID;
                let bankManagerId = data.recordset[0].CreatedBy;

                // get applicantId from application table
                MsSqlQuery = SqlString.format(`SELECT ApplicantID from ${TableName.Application} where AppID =${applicationId}`);
                let queryData = await executeQuery(MsSqlQuery);
                let applicantId = queryData.recordset[0].ApplicantID;

                // store applicant Id and bank manager Id in an array
                let userIds = [applicantId, bankManagerId];

                let usersData = [];
                for (userId of userIds) {
                    let userData = {
                        userId: userId,
                        userDetails: await getUserRecord(userId)
                    }
                    usersData.push(userData);
                }

                //send sms to bank manager and applicant
                let smsTemplateData = await SMSPublicNoticeIssued.getSmsTemplateRecord();
                for (userData of usersData) {
                    try {
                        let smsResult = await SMSPublicNoticeIssued.sendSmsToUser(smsTemplateData, userData.userDetails);
                    }
                    catch (e) {
                        errMessages.push(JSON.parse(e.message));
                    }
                }

                //send Email to bank manager and applicant
                let emailTemplateData = await EmailPublicNoticeIssued.getEmailTemplateRecord();
                for (userData of usersData) {
                    try {
                        let emailResult = await EmailPublicNoticeIssued.sendEmailToUser(emailTemplateData, userData.userDetails);
                    }
                    catch (e) {
                        errMessages.push(JSON.parse(e.message));
                    }
                }
            }
            catch (e) {
                errMessages.push(JSON.parse(e.message));
            }
        }
        else {
            res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: SERVER_ERROR_NOT_FOUND, message: "Records Not found" }, new ResponseModel()));
            return;
        }

        if (errMessages.length > 0) {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, error_code: INTERNAL_SERVER_ERROR, message: "IsPublished Status Successfully Updated!! There is an error in sending SMS or Email to Applicant or Bank manager" + JSON.stringify(errMessages) }, new ResponseModel()));
        }
        else {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.rowsAffected, message: "IsPublished Status Successfully Updated!! SMS and Email are sent to Applicant and Bank manager" }, new ResponseModel()));
        }
    }
    catch (err) {
        var errMessage = `An error occurred during updating IsPUblished status in table ${TableName.PublicNoticeFormat}`;;
        APIErrorLog(MsSqlQuery, err.message, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
    }
}

var getUserRecord = async (userId) => {
    try {
        var MsSqlQuery = SqlString.format(`Select * from ${TableName.UserMaster} where UserID = ${userId}`);
        let queryData = await executeQuery(MsSqlQuery);
        return queryData.recordset[0];
    }
    catch (err) {
        throw new Error(JSON.stringify({
            Name: MsSqlQuery,
            errMessage: `An error occurred during Fetching User Record`,
            error_code: 'SERVER_ERROR',
            err
        }));
    }
}

var GETPublicNoticeResponse = async (req, res) => {
    try {
        var MsSqlQuery = SqlString.format(`SELECT * from ${TableName.PublicNoticeResponse}`);

        if (req.params.publicNoticeResponseId) {
            MsSqlQuery += SqlString.format(` where NoticeResponceID=${req.params.publicNoticeResponseId}`);
        }

        let data = await executeQuery(MsSqlQuery);
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: `Public Notice Response data successfully Fetched` }, new ResponseModel()));
    }
    catch (err) {
        var errMessage = `An error occurred during Fetching Public Notice data from table ${TableName.PublicNoticeResponse}`;;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
    }
}

var POSTPublicNoticeResponse = async (req, res) => {

    var model = new modelBuilder().buildModel(req.body, new PublicNoticeResponseModel());

    model.CreatedBy = req.body.CreatedBy;
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

    runStoredProcedure(spName.PublicNoticeResponse, inputparams)
        .then(result => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "data successfully Inserted" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Adding Public Notice Response data`;
            APIErrorLog(spName.PublicNoticeResponse, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: SERVER_ERROR, error: errMessage }, new ResponseModel()));
        })
}


router.get('/api/publicnotice/language/all', GETLanguage);
router.get('/api/publicnotice/newspaper/all', GETNewsPaper);
router.get('/api/publicnotice/format/all', GETPublicNoticeFormat);
router.post('/api/publicnotice/add', POSTPublicNotice);
router.get('/api/publicnotice/all', GETPublicNotice);
router.get('/api/publicnotice/view/:publicNoticeId', GETPublicNotice);
router.put('/api/publicnotice/update/:publicNoticeId', PUTPublicNotice);
router.put('/api/publicnotice/ispublished/status/:publicNoticeId', PUTUpdatePublishStatus);
router.get('/api/publicnotice/response/all', GETPublicNoticeResponse);
router.post('/api/publicnotice/response/add', POSTPublicNoticeResponse);
module.exports = router;