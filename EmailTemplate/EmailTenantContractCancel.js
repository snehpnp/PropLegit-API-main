
const ejs = require("ejs");
const sendmail = require('../Email/Email');
const { OTPEmail } = require('../config/db');
const emailLog = require('../shared/emailLog');


var EmailTenantContractCancel = (TenantInfo, bodydata, emailTemplateInfo) => {

    return new Promise(async (resolve, reject) => {

        const { TenantName, TenantEmail } = await { ...TenantInfo }

        const { TemplateID, TemplateSubject, TemplateBody } = await { ...emailTemplateInfo };

        try {
            const subject = await ejs.render(TemplateSubject, bodydata, { async: true });
            const html = await ejs.render(TemplateBody, bodydata, { async: true });

            var sendEmailResult = await sendmail(TenantEmail, OTPEmail.From, OTPEmail.BCC, subject, html);

            var LogResult = await emailLog({
                UserID: null,
                EmailTo: TenantEmail,
                Name: TenantName,
                TemplateID: TemplateID,
                EmailMessageID: sendEmailResult.messageId
            })

            resolve(sendEmailResult);
        } catch (err) {
            reject(err);
        }

    })

}

module.exports = EmailTenantContractCancel;