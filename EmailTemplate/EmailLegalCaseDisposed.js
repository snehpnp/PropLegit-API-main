
const ejs = require("ejs");
const sendmail = require('../Email/Email');
const { OTPEmail } = require('../config/db');
const emailLog = require('../shared/emailLog');


var EmailLegalCaseDisposed = (caseInfo, senderInfo, emailTemplateInfo, DocumentInfo) => {

    return new Promise(async (resolve, reject) => {

        const { CompanyName, StateName, LegalCaseTypeName, CaseNumber, DistrictName } = await { ...caseInfo }

        const { TemplateID, TemplateSubject, TemplateBody } = await { ...emailTemplateInfo };

        const { FileURL } = await { ...DocumentInfo };

        const LawyerInfos = senderInfo.filter(e => e.Type = 'Lawyer');
        const LawyerInfo = LawyerInfos[0]
        var LawyerName = '';

        if (LawyerInfo) LawyerName = LawyerInfo.Name;

        var attachmentsArray = [];

        if (FileURL) {
            attachmentsArray = [{
                // use URL as an attachment
                filename: 'Legal_Case_Disposed_Document.pdf',
                path: FileURL
            }]
        }

        try {
            senderInfo.forEach(async (element) => {
                var { Name, Email, Mobile, Type } = await { ...element }

                var object = await {
                    Name: Name,
                    ClientName: CompanyName,
                    StateName,
                    CaseType: LegalCaseTypeName,
                    CaseNumber,
                    DistrictName,
                    LawyerName
                }

                const subject = await ejs.render(TemplateSubject, { Type }, { async: true });
                const html = await ejs.render(TemplateBody, object, { async: true });

                var sendEmailResult = await sendmail(Email, OTPEmail.From, OTPEmail.BCC, subject, html, attachmentsArray);

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

module.exports = EmailLegalCaseDisposed;