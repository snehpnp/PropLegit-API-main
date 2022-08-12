var router = require('express').Router();
const sql = require('mssql');
var SqlString = require('sqlstring');

const { runStoredProcedure, executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var CurrentDateTime = require('../shared/CurrentDateTime');

var tblTax = `tbl_PropertyTax`;
var tblUser = 'tbl_UserMaster';

var EmailPropertyTaxReminder = require('../EmailTemplate/PropertyTaxReminder');
var SMSPropertyTaxReminder = require('../SMSTemplate/PropertyTaxReminder');

const sp_ReminderList = 'sp_GET_Property_Tax_ReminderList'

var GETPropertyTaxReminder = async (req, res) => {

    var date = CurrentDateTime();

    // var date = await CurrentDateTime();

    // model = await { TodayDate: date }

    // var inputparams = [];

    // await Object.keys(model).forEach(element => {
    //     inputparams.push({
    //         "name": element,
    //         "type": sql.NVarChar,
    //         "value": model[element] ? model[element] : null
    //     })
    // });

    // try {
    //     var data = await runStoredProcedure(sp_ReminderList, inputparams);
    //     const MasterData = await data.recordsets;

    //     const caseinfo = await MasterData[0];
    //     const senderInfo = await MasterData[1];
    //     const emailTemplateInfo = await MasterData[2];
    //     const SMSTemplateInfo = await MasterData[3];

    //     await caseinfo.forEach(element => {
    //         const { LegalCaseID } = { ...element };

    //         const senderobject = senderInfo.filter(f => f.LegalCaseID = LegalCaseID);

    //         if (senderobject.length > 0) {
    //             try {
    //                 const emailresult = EmailLegalCaseReminder(element, senderobject, emailTemplateInfo[0]);

    //                 const smsResuit = SMSLegalCaseReminder(element, senderobject, SMSTemplateInfo[0]);
    //             } catch (err) {
    //                 var errMessage = `An error occurred during Send Property Legal case Reminder Email or SMS`;
    //                 APIErrorLog(sp_ReminderList, { ...err }, req.headers, req.body, errMessage, req.method, req.params, req.query);
    //                 return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    //             }
    //         }

    //     })


    //     return res.status(200).send(new modelBuilder().buildModel({
    //         status: 200, data: senderInfo, message: "Property Rent Reminder sent Successfully"
    //     }, new ResponseModel()));



    // } catch (err) {
    //     var errMessage = `An error occurred during Send Property legal case Reminder`;
    //     APIErrorLog(sp_ReminderList, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
    //     return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    // }




    var MsSqlQuery = SqlString.format(`Select PropertyTaxID, FinancialTaxYear, DueDate, PropertyID, UserID, IIF(DATEDIFF(DAY, convert(date, ?), DueDate) < 0, NULL, DATEDIFF(DAY, convert(date, ?), DueDate)) as [BeforeDays] from ${tblTax} t
        left join  ${tblUser} u
        on u.UserID = t.CreatedBy
        where ReceiptID IS NULL
        AND UserID IS NOT NULL
        AND (DATEDIFF(DAY, convert(date, ?), DueDate) in (30, 15, 7, 0)
        OR DATEDIFF(DAY, convert(date, ?), DueDate) < 0)`, [date, date, date, date]);

    executeQuery(MsSqlQuery)
        .then(ResultUsers => {

            var Users = ResultUsers.recordset;

            if (Users.length == 0) {
                return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: Users, message: "No Users Found!" }, new ResponseModel()));
            }

            var sentReminder = [];

            Users.forEach(user => {

                EmailPropertyTaxReminder(user)
                    .then(EmailResult => {

                        SMSPropertyTaxReminder(user)
                            .then(SMSResult => {
                                sentReminder.push(user);
                                if (Users.length === sentReminder.length) {
                                    return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: sentReminder, message: "Property Tax Reminder sent Successfully" }, new ResponseModel()));
                                }
                            })
                            .catch(err => {
                                var errMessage = err.errMessage;
                                APIErrorLog(err.Name, err.err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: err.error_code, error: errMessage }, new ResponseModel()));
                            })
                    })
                    .catch(err => {
                        var errMessage = err.errMessage;
                        APIErrorLog(err.Name, err.err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: err.error_code, error: errMessage }, new ResponseModel()));
                    })
            })


        })
        .catch(err => {
            var errMessage = `An error occurred during Send Property Tax Reminder`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

        })

}

router.get('/api/property/reminder/tax', GETPropertyTaxReminder);

module.exports = router;
