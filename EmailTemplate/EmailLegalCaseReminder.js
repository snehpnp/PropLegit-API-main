const ejs = require("ejs");
const sendmail = require('../Email/Email');
const { OTPEmail } = require('../config/db');
const emailReminderLog = require('../shared/emailReminderLog');


var EmailLegalCaseReminder = (caseInfo, senderInfo, emailTemplateInfo) => {

    return new Promise(async (resolve, reject) => {

        const { HearingDate, Judge, CourtName, CourtNumber, CourtAddress, CaseNumber, Iam, DistrictName, StateName, Days } = await { ...caseInfo }

        const { ReminderID, TemplateSubject, TemplateBody } = await { ...emailTemplateInfo };

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

                const subject = await ejs.render(TemplateSubject, object, { async: true });
                const html = await ejs.render(TemplateBody, object, { async: true });

                var sendEmailResult = await sendmail(Email, OTPEmail.From, OTPEmail.BCC, subject, html);

                var LogResult = await emailReminderLog({
                    ReminderID,
                    PropertyID: null,
                    UserID: null,
                    Name,
                    Email,
                    Mobile,
                    EmailMessageID: sendEmailResult.messageId
                })

                resolve(sendEmailResult);
            });
        } catch (err) {
            reject(err);
        }

    })

}

module.exports = EmailLegalCaseReminder;