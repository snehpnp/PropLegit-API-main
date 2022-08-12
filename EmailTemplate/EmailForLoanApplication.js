
const ejs = require("ejs");
const sendmail = require('../Email/Email');
const { OTPEmail } = require('../config/db');
const emailLog = require('../shared/emailLog');

const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

const tblTemplates = 'tbl_Templates'
const LoanEmailTemplateID = 30

module.exports = async (Email, AppID, BCCArray) => {

    return new Promise(async (resolve, reject) => {

        try {

            var MsSqlQuery = await SqlString.format(`Select * from vw_LoanApplication where AppID = ?;Select * FRom ${tblTemplates} where TemplateID = ?`, [AppID, LoanEmailTemplateID])

            const AppDetails = await executeQuery(MsSqlQuery);
            const MasterData = await AppDetails.recordsets;
            const AppData = await MasterData[0];
            const Template = await MasterData[1];

            const { TemplateID, TemplateSubject, TemplateBody } = await { ...Template[0] }

            const subject = await ejs.render(TemplateSubject, AppData[0], { async: true });
            const html = await ejs.render(TemplateBody, AppData[0], { async: true });

            var sendEmailResult = await sendmail(Email, OTPEmail.From, BCCArray, subject, html);

            var LogResult = await emailLog({
                UserID: null,
                EmailTo: Email,
                Name: null,
                TemplateID: TemplateID,
                EmailMessageID: sendEmailResult.messageId
            })

            resolve(sendEmailResult);

        } catch (err) {

            reject(err);

        }

    })


}
