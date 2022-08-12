var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery, runStoredProcedure, UpdateQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var PropertyLegalcaseHearingModel = require('../Model/PropertyLegalcaseHearingModel')

const SendHearingEmail = require('../shared/SendHearingEmail');

var CurrentDateTime = require('../shared/CurrentDateTime');

var TableName = 'tbl_PropertyLegalcaseHearing';
var spName = 'sp_POST_PropertyLegalcaseHearing';
const FirstHearing = 'View_LegalCase_FirstHearing';
const LastHearing = 'View_LegalCase_LastHearing'

var POSTPropertyLegalcaseHearing = async (req, res) => {

    const { LegalCaseID } = await { ...req.params }
    const { CreatedBy } = await { ...req.body }

    var model = await new modelBuilder().buildModel(req.body, new PropertyLegalcaseHearingModel());

    model.CreatedAt = CurrentDateTime();
    model.CreatedBy = CreatedBy;
    model.IpAddress = req.connection.remoteAddress;
    model.LegalCaseID = LegalCaseID;

    var inputparams = [];

    await Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {

        const result = await runStoredProcedure(spName, inputparams);
        const HearingEmail = SendHearingEmail(LegalCaseID);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "Legal Case Hearing Date Successfully Inserted" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Adding Property Legal Case Hearing data`;
        APIErrorLog(spName, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var GETPropertyLegalCaseHearing = (req, res) => {

    var MsSqlQuery = SqlString.format(`Select * from ${TableName} where 1=1 `);

    if (req.params.LegalCaseID) {
        MsSqlQuery += SqlString.format(' AND LegalCaseID = ?', [req.params.LegalCaseID])
    }

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Property Legal case List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var GETPropertyLegalCaseLastHearing = async (req, res) => {

    var { LegalCaseID } = await { ...req.params };

    var MsSqlQuery = await SqlString.format(`Select * from ${LastHearing} where LegalCaseID = ?; Select HearingDate as FirstHearingDate from ${FirstHearing} where LegalCaseID = ?`, [LegalCaseID, LegalCaseID]);

    try {
        const data = await executeQuery(MsSqlQuery);
        const MasterData = await data.recordsets;
        const LasthearinginfowithDetails = await MasterData[0];
        const FirstHearinginfo = await MasterData[1];
        let obj = await { ...LasthearinginfowithDetails[0], ...FirstHearinginfo[0] }

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: obj, message: "data successfully Fetched" }, new ResponseModel()));
    } catch (err) {
        var errMessage = `An error occurred during Fetching Property Legal case Hearing List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.post('/api/property/case/:LegalCaseID/next-hearing', POSTPropertyLegalcaseHearing);
router.get('/api/property/case/:LegalCaseID/current-hearing', GETPropertyLegalCaseHearing);
router.get('/api/property/case/:LegalCaseID/last-hearing', GETPropertyLegalCaseLastHearing);

module.exports = router;
