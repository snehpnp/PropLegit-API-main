
const ejs = require("ejs");
var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

const SMSLog = require('../shared/SMSLog')

var SMSLegalCaseDisposed = (caseInfo, senderInfo, smsTemplateInfo) => {

    return new Promise(async (resolve, reject) => {

        const { CompanyName, StateName, LegalCaseTypeName, CaseNumber, DistrictName } = await { ...caseInfo }

        const { TemplateID, TemplateBody } = await { ...smsTemplateInfo };

        const LawyerInfos = senderInfo.filter(e => e.Type = 'Lawyer');
        const LawyerInfo = LawyerInfos[0]
        var LawyerName = '';

        if (LawyerInfo) LawyerName = LawyerInfo.Name;

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

                const body = await ejs.render(TemplateBody, object, { async: true });

                var sendSMSResult = await sendSMSBYSMSCountry(Mobile, body, OTPSMS.sid);

                var LogResult = await SMSLog({
                    UserID: null,
                    MobileNumber: Mobile,
                    Name,
                    TemplateID: TemplateID,
                    SMSResponce: sendSMSResult.body
                })

                resolve(sendSMSResult);
            });
        } catch (err) {
            reject(err);
        }

    })

}

module.exports = SMSLegalCaseDisposed;