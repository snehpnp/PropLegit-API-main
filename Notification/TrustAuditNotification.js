var router = require('express').Router();
const sql = require('mssql');
var SqlString = require('sqlstring');
const { runStoredProcedure, executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var CurrentDateTime = require('../shared/CurrentDateTime');
const EmailCommonReminder = require('../EmailTemplate/EmailCommonTrustReminder');
const SMSForReminder = require('../SMSTemplate/CommonSMSTrustReminder');

var spgetTrustAuditNotification = `sp_GET_trust_audit_notification`;

var GETTrustAuditNotification = async(req, res) => {

    var date = CurrentDateTime();

    var { TrustID } = await {...req.params }

    var model = await { id: TrustID, TodayDate: date }

    var inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {
        const MasterData = await runStoredProcedure(spgetTrustAuditNotification, inputparams);
        const Notification = await MasterData.recordsets;
        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: {
                "DueDate_between_30_16": Notification[0],
                "DueDate_between_15_8": Notification[1],
                "DueDate_between_7_1": Notification[2],
                "DueDate_Today": Notification[3],
                "DueDate_Past": Notification[4]
            },
            message: "Trust Audit Notification Data successfully Fetched"
        }, new ResponseModel()));
    } catch (err) {
        var errMessage = `An error occurred during Fetching Trust Audit Alerts Data`;
        APIErrorLog(spgetTrustAuditNotification, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.get('/api/trust/audit/notification/TrustID/:TrustID', GETTrustAuditNotification);


module.exports = router;