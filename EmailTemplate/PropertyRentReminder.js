const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');
let ejs = require("ejs");

var { OTPEmail } = require('../config/db.js');
var sendmail = require('../Email/Email');

var TableReminder = `tbl_PropertyReminder`;

var emailReminderLog = require('../shared/emailReminderLog');

var PropertyRentReminder = (tenantinfo) => {

    return new Promise(async (resolve, reject) => {

        var { PropertyID, TenantName, TenantEmail, TenantMobile, BeforeDays, FileURL } = await { ...tenantinfo }



        var MsSqlQuery = await SqlString.format(`Select Top 1 * from ${TableReminder} where ReminderFor = 'Property Rent' AND TemplateType = 'Email'
        AND ( Days = ? OR Days IS  NULL);`, [BeforeDays])

        try {
            var TemplateResult = await executeQuery(MsSqlQuery);
            var Template = await TemplateResult.recordset[0];

            var { ReminderID, TemplateSubject, TemplateBody } = await { ...Template };

            const subject = await ejs.render(TemplateSubject, tenantinfo, { async: true });
            const html = await ejs.render(TemplateBody, tenantinfo, { async: true });

            var attachmentsArray = [];

            if (FileURL) {
                attachmentsArray = [{
                    // use URL as an attachment
                    filename: 'Property_Rent_Invoice.pdf',
                    path: FileURL
                }]
            }

            var sendEmailResult = await sendmail(TenantEmail, OTPEmail.From, OTPEmail.BCC, subject, html, attachmentsArray);

            var LogResult = await emailReminderLog({
                ReminderID,
                PropertyID,
                UserID: null,
                Name: TenantName,
                Email: TenantEmail,
                Mobile: TenantMobile,
                EmailMessageID: sendEmailResult.messageId
            })

            resolve(sendEmailResult);

        } catch (err) {
            reject(err);
        }
    })

}

module.exports = PropertyRentReminder