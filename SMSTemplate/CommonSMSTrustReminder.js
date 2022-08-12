const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');
let ejs = require("ejs");
var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');
var TableReminder = `tbl_PropertyReminder`;
var ReminderLog = require('../shared/emailReminderLog');
var SMSForReminder = (template, meetinginfo) => {
    return new Promise(async(resolve, reject) => {
        try {
            var { TemplateBody } = await {...template };
            // var tmpArray = []
            const body = await ejs.render(TemplateBody, meetinginfo, { async: true });
            // await Promise.all(users.map(async(x) => {
            var sendSMSResult = await sendSMSBYSMSCountry(meetinginfo.Mobile, body, OTPSMS.sid)
            var LogResult = await ReminderLog({
                    UserID: null,
                    Name: meetinginfo.Name,
                    Email: meetinginfo.Email,
                    Mobile: meetinginfo.Mobile,
                    SMSResponce: sendSMSResult.body
                })
                // return tmpArray.push(sendSMSResult.body);
                // }))
            resolve(sendSMSResult);
        } catch (err) {
            reject(err);
        }

    })

}

module.exports = SMSForReminder