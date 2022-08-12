
const ejs = require("ejs");
const sendmail = require('../Email/Email');
const { OTPEmail } = require('../config/db');
const emailLog = require('../shared/emailLog');

var EmailLegalCase = (caseInfo, senderInfo, emailTemplateInfo) => {

    return new Promise(async (resolve, reject) => {

        const { CompanyName, StateName, LegalCaseTypeName, CaseNumber, DistrictName } = await { ...caseInfo }

        const { TemplateID, TemplateSubject, TemplateBody } = await { ...emailTemplateInfo };

        try {
            senderInfo.forEach(async (element) => {
                var { Name, Email, Mobile, Type } = await { ...element }

                var object = await {
                    Name: Name,
                    ClientName: CompanyName,
                    StateName,
                    CaseType: LegalCaseTypeName,
                    CaseNumber,
                    DistrictName
                }

                const subject = await ejs.render(TemplateSubject, { Type }, { async: true });
                const html = await ejs.render(TemplateBody, object, { async: true });

                var sendEmailResult = await sendmail(Email, OTPEmail.From, OTPEmail.BCC, subject, html);

                var LogResult = await emailLog({
                    UserID: null,
                    EmailTo: Email,
                    Name: Name,
                    TemplateID: TemplateID,
                    EmailMessageID: sendEmailResult.messageId
                })

                resolve(sendEmailResult);
            });
        } catch (err) {
            reject(err);
        }

    })

}

module.exports = EmailLegalCase;