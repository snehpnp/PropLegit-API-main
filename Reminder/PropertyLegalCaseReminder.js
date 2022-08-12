const router = require('express').Router();
const sql = require('mssql');

const { runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

const ResponseModel = require('../Model/ResponseModel');
const modelBuilder = require('../helpers/modelBuilder');

const CurrentDateTime = require('../shared/CurrentDateTime');

const spLegalCaseReminderList = `sp_GET_Property_LegalCase_ReminderList`;

const EmailLegalCaseReminder = require('../EmailTemplate/EmailLegalCaseReminder');
const SMSLegalCaseReminder = require('../SMSTemplate/SMSLegalCaseReminder')

var GETPropertyLegalCaseReminder = async (req, res) => {

    var date = await CurrentDateTime();

    model = await { TodayDate: date };

    var inputparams = [];

    await Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {
        var data = await runStoredProcedure(spLegalCaseReminderList, inputparams);
        const MasterData = await data.recordsets;
        const caseinfo = await MasterData[0];
        const senderInfo = await MasterData[1];
        const emailTemplateInfo = await MasterData[2];
        const SMSTemplateInfo = await MasterData[3];

        await caseinfo.forEach(element => {
            const { LegalCaseID } = { ...element };

            const senderobject = senderInfo.filter(f => f.LegalCaseID == LegalCaseID);

            if (senderobject.length > 0) {
                try {
                    const emailresult = EmailLegalCaseReminder(element, senderobject, emailTemplateInfo[0]);

                    const smsResuit = SMSLegalCaseReminder(element, senderobject, SMSTemplateInfo[0]);
                } catch (err) {
                    var errMessage = `An error occurred during Send Property Legal case Reminder Email or SMS`;
                    APIErrorLog('sp_GET_Property_LegalCase_ReminderList', { ...err }, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                }
            }

        })


        return res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: senderInfo, message: "Property legal case Reminder sent Successfully"
        }, new ResponseModel()));



    } catch (err) {
        var errMessage = `An error occurred during Send Property legal case Reminder`;
        APIErrorLog(spLegalCaseReminderList, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }

}

router.get('/api/property/reminder/legal/case', GETPropertyLegalCaseReminder);

module.exports = router;
