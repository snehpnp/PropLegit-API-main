const ejs = require("ejs");
const sendmail = require('../Email/Email');
const { OTPEmail } = require('../config/db');
const emailLog = require('../shared/emailLog');

var EmailCommonReminder = (MeetingInfo, emailTemplateInfo) => {

    return new Promise(async(resolve, reject) => {

        const { AgendaDocumentPath, MOMDocumentPath } = await {...MeetingInfo }
        const { TemplateID, TemplateSubject, TemplateBody } = await {...emailTemplateInfo };
        var attachmentsArray = [];
        if (AgendaDocumentPath) {
            attachmentsArray = [{
                // use URL as an attachment
                filename: 'Agenda_Document.pdf',
                path: AgendaDocumentPath
            }]
        }
        if (MOMDocumentPath) {
            attachmentsArray = [{
                // use URL as an attachment
                filename: 'MOM_Document.pdf',
                path: AgendaDocumentPath
            }]
        }
        try {
            // await Promise.all(ToUsers.map(async(element) => {
            var { Name, Email, Mobile } = await {...MeetingInfo }
            console.log('MeetingInfo: ', MeetingInfo);
            const subject = await ejs.render(TemplateSubject, {...MeetingInfo }, { async: true });
            const html = await ejs.render(TemplateBody, {...MeetingInfo }, { async: true });
            var sendEmailResult = await sendmail(Email, OTPEmail.From, OTPEmail.BCC, subject, html, attachmentsArray);
            var LogResult = await emailLog({
                UserID: null,
                EmailTo: Email,
                Name: Name,
                TemplateID: TemplateID,
                EmailMessageID: sendEmailResult.messageId
            })
            resolve(sendEmailResult)
                // }));
                // resolve(tmpArray);
        } catch (err) {
            reject(err);
        }
    })
}

module.exports = EmailCommonReminder;