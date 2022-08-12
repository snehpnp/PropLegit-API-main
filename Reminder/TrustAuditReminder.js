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

        const Noti = await MasterData.recordsets;
        const variable = await sendReminders(Noti[0], TrustID)
        const variable1 = await sendReminders(Noti[1], TrustID)
        const variable2 = await sendReminders(Noti[2], TrustID)
        const variable3 = await sendReminders(Noti[3], TrustID)
        const variable4 = await sendReminders(Noti[4], TrustID)
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
var sendReminders = (data, id) => {
    return new Promise(async(resolve, reject) => {
        try {
            if (data.length > 0) {

                await Promise.all(data.map(async(x) => {
                    const mssqlquery = SqlString.format(`Select Name as AuditName,Mobile,Email from TrusteeUsers WHERE TrusteeUserID = ${x.AuditUser};
            select TrustName From tbl_PropertyTrustMaster where TrustID = ${id};
            Select * From tbl_Templates Where TemplateID IN (43,44);
            Select Name as AuditName,Mobile,Email from TrusteeUsers WHERE TrusteeUsertypeID IN (2,3) AND TrustID = ${id}`);
                    const run = await executeQuery(mssqlquery)
                    const record = run.recordsets
                    const object = Object.assign(x, record[0][0], record[1][0])
                    const Email = await EmailCommonReminder(object, record[2][0])
                    const SMS = await SMSForReminder(record[2][1], object)
                    const TrusteeUser = record[3]
                    const sendReminder = await callback(TrusteeUser, record, x, 0)
                    return;

                }))
            }
            resolve()
        } catch (error) {
            console.log('error: ', error);
            reject(error)

        }
    })
}

var callback = (users, record, reminderData, index) => {
    return new Promise(async(resolve, reject) => {
        try {
            if (index < users.length) {
                const objects = Object.assign(reminderData, users[index], record[1][0])
                const Emails = await EmailCommonReminder(objects, record[2][0])
                const SMSs = await SMSForReminder(record[2][1], objects)
                callback(users, record, reminderData, ++index).then(resolve)
            } else {
                resolve({ success: 'send' })
            }

        } catch (error) {
            reject(error)
        }
    })
}
router.get('/api/trust/audit/reminder/TrustID/:TrustID', GETTrustAuditNotification);


module.exports = router;