var router = require('express').Router();
const sql = require('mssql');
var SqlString = require('sqlstring');
const { runStoredProcedure, executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var CurrentDateTime = require('../shared/CurrentDateTime');
const SMSForReminder = require('../SMSTemplate/CommonSMSTrustReminder');
const EmailCommonReminder = require('../EmailTemplate/EmailCommonTrustReminder');
// const { PasswordGenerator } = require('../shared/RendomPasswordGanerator');

var spgetMeetingNotification = `sp_GET_trust_meeting_notification`;

var GETTrustMeetingNotification = async(req, res) => {

    var date = CurrentDateTime();

    // await sendNotification();
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
        const MasterData = await runStoredProcedure(spgetMeetingNotification, inputparams);
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
            message: "Trust Meeting Notification Data successfully Fetched"
        }, new ResponseModel()));
    } catch (err) {
        console.log('err: ', err);
        var errMessage = `An error occurred during Fetching Trust Meeting Alerts Data`;
        APIErrorLog(spgetMeetingNotification, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }

}
router.get('/api/trust/meeting/notification/TrustID/:TrustID', GETTrustMeetingNotification);


module.exports = router;