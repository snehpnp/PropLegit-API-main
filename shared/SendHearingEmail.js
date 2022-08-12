const sql = require('mssql')

const { runStoredProcedure } = require('../MsSql/Query');

const EmailLegalCaseReminder = require('../EmailTemplate/EmailLegalCaseReminder');
const SMSLegalCaseReminder = require('../SMSTemplate/SMSLegalCaseReminder')

const Hearing_datails_Send = 'sp_GET_LegalCase_Hearing_datails_Send'

module.exports = (LegalCaseID) => {

    return new Promise(async (resolve, reject) => {

        try {

            const model = await { LegalCaseID }

            var inputparams = [];

            await Object.keys(model).forEach(element => {
                inputparams.push({
                    "name": element,
                    "type": sql.NVarChar,
                    "value": model[element] ? model[element] : null
                })
            });

            var HearingResult = await runStoredProcedure(Hearing_datails_Send, inputparams)
            const MasterData = await HearingResult.recordsets;
            const caseinfo = await MasterData[0];
            const senderInfo = await MasterData[1];
            const emailTemplateInfo = await MasterData[2];
            const SMSTemplateInfo = await MasterData[3];

            if (senderInfo.length < 0) {
                resolve(HearingResult)
            }

            const emailresult = await EmailLegalCaseReminder(caseinfo[0], senderInfo, emailTemplateInfo[0]);

            const smsResuit = await SMSLegalCaseReminder(caseinfo[0], senderInfo, SMSTemplateInfo[0]);


            resolve({ messageId: emailresult.messageId, smsResuit: smsResuit.body })
        } catch (err) {
            reject(err);
        }

    })
}