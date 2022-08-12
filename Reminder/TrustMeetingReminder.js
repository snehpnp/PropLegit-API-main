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
        console.log('Notification: ', Notification);
        var sendReminders1 = await sendNotification(Notification[0], TrustID)
        var sendReminders2 = await sendNotification(Notification[1], TrustID)
        var sendReminders3 = await sendNotification(Notification[2], TrustID)
        var sendReminders4 = await sendNotification(Notification[3], TrustID)
        var sendReminders5 = await sendNotification(Notification[4], TrustID)
        console.log('Notification: ', Notification);
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
var sendNotification = async(data, trustid) => {
    await Promise.all(data.map((async(x) => {
        const getYear = new Date(x.MeetingdateTime)
        const year = getYear.getFullYear();
        const query = await SqlString.format(`select dbo.ufnGetMeeting_Count_By_Year ('${trustid}','${year}') 
        as Meeting_Count;Select Name as mantriName,Mobile,Email From TrusteeUsers Where TrusteeUsertypeID = 3 AND 
        TrustID = ${trustid};select * from View_TrustMeeting where MeetingID = ${x.MeetingID};
        Select * From tbl_Templates Where TemplateID IN (37,38)`);

        const run = await executeQuery(query)
        const record = await run.recordsets
        const Trustee = record[1]
            // if (Trustee.length > 0) {
            //     await Promise.all(Trustee.map(async(xs) => {
            //         var object = await Object.assign(record[0][0], xs, record[2][0])
            //         var SMS = await SMSForReminder(record[3][1], object);
            //         var Email = await EmailCommonReminder(object, record[3][0])
            //         return;
            //     }))

        // }
        const sendReminder = await callback(Trustee, record, x, 0)
    })))
    return;
}
var callback = (users, record, reminderData, index) => {
    return new Promise(async(resolve, reject) => {
        try {
            if (index < users.length) {
                const objects = Object.assign(record[2][0], users[index], record[0][0])
                const Emails = await EmailCommonReminder(objects, record[3][0])
                const SMSs = await SMSForReminder(record[3][1], objects)
                callback(users, record, reminderData, ++index).then(resolve)
            } else {
                resolve({ success: 'send' })
            }

        } catch (error) {
            reject(error)
        }
    })
}
router.get('/api/trust/meeting/reminder/TrustID/:TrustID', GETTrustMeetingNotification);


module.exports = router;