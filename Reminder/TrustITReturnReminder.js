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

var spgetTrustItReturnNotification = `sp_GET_trust_itreturns_notification`;

var GETTrustITReturnNotification = async(req, res) => {

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
        const MasterData = await runStoredProcedure(spgetTrustItReturnNotification, inputparams);
        const Notification = await MasterData.recordsets;
        const variable = await sendReminders(Notification[0], TrustID)
        const variable1 = await sendReminders(Notification[1], TrustID)
        const variable2 = await sendReminders(Notification[2], TrustID)
        const variable3 = await sendReminders(Notification[3], TrustID)
        const variable4 = await sendReminders(Notification[4], TrustID)
        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: {
                "DueDate_between_30_16": Notification[0],
                "DueDate_between_15_8": Notification[1],
                "DueDate_between_7_1": Notification[2],
                "DueDate_Today": Notification[3],
                "DueDate_Past": Notification[4]
            },
            message: "Trust IT Return Notification Data successfully Fetched"
        }, new ResponseModel()));
    } catch (err) {
        var errMessage = `An error occurred during Fetching Trust IT Return Alerts Data`;
        APIErrorLog(spgetTrustItReturnNotification, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }

}
var sendReminders = (data, id) => {
    return new Promise(async(resolve, reject) => {
        try {
            if (data.length > 0) {
                var year = new Date().getFullYear()
                var date = year + '/03/31'
                await Promise.all(data.map(async(x) => {
                    // console.log('x: ', x);
                    const mssqlquery = SqlString.format(`Select Name as LawyerName,Mobile,Email from TrusteeUsers WHERE TrusteeUserID = ${x.LawyerID};
            select TrustName From tbl_PropertyTrustMaster where TrustID = ${id};
            Select * From tbl_Templates Where TemplateID IN (41,42);
            Select Name as LawyerName,Mobile,Email From TrusteeUsers Where TrusteeUsertypeID = 3 AND 
        TrustID = ${id};`);
                    const run = await executeQuery(mssqlquery)
                    const record = run.recordsets
                        // console.log('record: ', record);
                    const object = await Object.assign({ dueDate: date }, x, record[0][0], record[1][0])
                    console.log('object: ', object);
                    const Email = await EmailCommonReminder(object, record[2][0])
                    const SMS = await SMSForReminder(record[2][1], object)
                        // if (record[3].length > 0) {
                        //     await Promise.all(record[3].map(async(xs) => {
                        //         const objects = Object.assign({ dueDate: date }, x, xs, record[1][0])
                        //         const Emails = await EmailCommonReminder(objects, record[2][0])
                        //         const SMSs = await SMSForReminder(record[2][1], objects)
                        //         return;
                        //     }))
                        // }
                    const sendReminder = await callback(record[3], record, x, 0)
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
            var year = new Date().getFullYear()
            var date = year + '/03/31'
            if (index < users.length) {
                const objects = Object.assign({ dueDate: date }, reminderData, users[index], record[1][0])
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
router.get('/api/trust/ITReturn/reminder/TrustID/:TrustID', GETTrustITReturnNotification);


module.exports = router;