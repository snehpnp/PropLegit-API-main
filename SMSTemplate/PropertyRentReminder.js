const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');
let ejs = require("ejs");

var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

var TableReminder = `tbl_PropertyReminder`;

var ReminderLog = require('../shared/emailReminderLog');

var PropertyRentReminder = (tenantinfo) => {

    return new Promise(async (resolve, reject) => {

        var { PropertyID, TenantName, TenantEmail, TenantMobile, BeforeDays } = await { ...tenantinfo }

        var MsSqlQuery = await SqlString.format(`Select Top 1 * from ${TableReminder} where ReminderFor = 'Property Rent' AND TemplateType = 'SMS'
        AND ( Days = ? OR Days IS  NULL);`, [BeforeDays])

        try {
            var TemplateResult = await executeQuery(MsSqlQuery);
            var Template = await TemplateResult.recordset[0];

            var { ReminderID, TemplateSubject, TemplateBody } = await { ...Template };

            const body = await ejs.render(TemplateBody, tenantinfo, { async: true });

            var sendSMSResult = await sendSMSBYSMSCountry(TenantMobile, body, OTPSMS.sid)

            var LogResult = await ReminderLog({
                ReminderID,
                PropertyID,
                UserID: null,
                Name: TenantName,
                Email: TenantEmail,
                Mobile: TenantMobile,
                SMSResponce: sendSMSResult.body
            })

            resolve(sendSMSResult);

        } catch (err) {
            reject(err);
        }

    })

}

module.exports = PropertyRentReminder