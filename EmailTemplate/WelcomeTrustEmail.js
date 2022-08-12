const ejs = require("ejs");
const sendmail = require('../Email/Email');
const { OTPEmail } = require('../config/db');
const emailLog = require('../shared/emailLog');


var WelcomeTrustEmail = (T_Users, emailTemplateInfo) => {

    return new Promise(async (resolve, reject) => {

        const { TemplateID, TemplateSubject, TemplateBody } = await { ...emailTemplateInfo };

        try {
            T_Users.forEach(async (element) => {
                var { Name, Email, Mobile } = await { ...element }

                const html = await ejs.render(TemplateBody, element, { async: true });

                var sendEmailResult = await sendmail(Email, OTPEmail.From, OTPEmail.BCC, TemplateSubject, html);

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

module.exports = WelcomeTrustEmail;