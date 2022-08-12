const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');
let ejs = require("ejs");

var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

var TableReminder = `tbl_PropertyReminder`;

var ReminderLog = require('../shared/emailReminderLog');

var SMSForMeeting = (users, template, meetinginfo) => {
    return new Promise(async(resolve, reject) => {
        try {
            var { TemplateBody } = await {...template };
            var tmpArray = []
            const body = await ejs.render(TemplateBody, meetinginfo, { async: true });
            await Promise.all(users.map(async(x) => {
                var sendSMSResult = await sendSMSBYSMSCountry(x.Mobile, body, OTPSMS.sid)
                var LogResult = await ReminderLog({
                    UserID: null,
                    Name: x.Name,
                    Email: x.Email,
                    Mobile: x.Mobile,
                    SMSResponce: sendSMSResult.body
                })
                return tmpArray.push(sendSMSResult.body);
            }))
            resolve(tmpArray);
        } catch (err) {
            reject(err);
        }

    })

}

module.exports = SMSForMeeting