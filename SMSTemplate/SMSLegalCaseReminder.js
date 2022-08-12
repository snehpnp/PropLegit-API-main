
const ejs = require("ejs");
var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

var ReminderLog = require('../shared/emailReminderLog');

var SMSLegalCaseReminder = (caseInfo, senderInfo, smsTemplateInfo) => {

    return new Promise(async (resolve, reject) => {

        const { HearingDate, Judge, CourtName, CourtNumber, CourtAddress, CaseNumber, Iam, DistrictName, StateName, Days } = await { ...caseInfo }

        const { ReminderID, TemplateSubject, TemplateBody } = await { ...smsTemplateInfo };

        try {
            senderInfo.forEach(async (element) => {
                var { Name, Email, Mobile, Type } = await { ...element }

                var object = await {
                    Name: Name,
                    CaseNumber,
                    StateName,
                    CourtNumber,
                    HearingDate
                }

                const body = await ejs.render(TemplateBody, object, { async: true });

                var sendSMSResult = await sendSMSBYSMSCountry(Mobile, body, OTPSMS.sid);

                var LogResult = await ReminderLog({
                    ReminderID,
                    PropertyID: null,
                    UserID: null,
                    Name,
                    Email,
                    Mobile,
                    SMSResponce: sendSMSResult.body
                })

                resolve(sendSMSResult);
            });
        } catch (err) {
            reject(err);
        }

    })

}

module.exports = SMSLegalCaseReminder;