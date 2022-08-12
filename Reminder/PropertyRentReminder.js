const router = require('express').Router();
const sql = require('mssql');
const SqlString = require('sqlstring');

const { executeQuery, runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');
const { MssqldatetimeFormat, CurrentdatetimeFormat } = require('../shared/datetimeFormat');

const ResponseModel = require('../Model/ResponseModel');
const modelBuilder = require('../helpers/modelBuilder');

const CurrentDateTime = require('../shared/CurrentDateTime');

const spPOSTRentReminder = `sp_POST_Rent_Reminder`;
const AutoentryNoRentPayer = 'sp_Auto_entry_No_Rent_Payer';

const GenerateRentInvoice = require('../shared/GenerateRentInvoice')

var PropertyRentReminderEmail = require('../EmailTemplate/PropertyRentReminder');
var PropertyRentReminderSMS = require('../SMSTemplate/PropertyRentReminder');
const { version } = require('moment');



var GETPropertyRentReminder = async (req, res) => {

    var date = await CurrentDateTime();

    model = await { Today: date }

    var inputparams = [];

    await Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {
        var MasterRentIDs = await runStoredProcedure(AutoentryNoRentPayer, inputparams);
        var RentID_For_Invoice_Genrate = await MasterRentIDs.recordset;

        const Invoice_Promise = (Rents) => {

            return new Promise(async (resolve, reject) => {

                if (Rents.length < 1) resolve();

                var InvoiceID = [];

                Rents.forEach(async (e) => {
                    try {

                        await GenerateRentInvoice(e.PropertyRentID);
                        InvoiceID.push(e);

                        if (InvoiceID.length == Rents.length) resolve()

                    } catch (err) {
                        reject(err)
                    }
                })
            })
        }

        try {
            const InvoiceResult = await Invoice_Promise(RentID_For_Invoice_Genrate)

            SendPropertyRentReminder(req, res);
        } catch (err) {
            var errMessage = `An error occurred during Genrate Invoice`;
            APIErrorLog('Invoice Promise', err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        }


    } catch (err) {
        console.log(err);
        var errMessage = `An error occurred during Auto entry of No Rent Payer`;
        APIErrorLog(AutoentryNoRentPayer, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }

}
var SendPropertyRentReminder = async (req, res) => {

    var date = await CurrentDateTime();

    model = await { TodayDate: date }

    var inputparams = [];

    await Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {
        var data = await runStoredProcedure(spPOSTRentReminder, inputparams);
        var tenantinfo = await data.recordset;

        await tenantinfo.forEach(async (element) => {

            try {
                element.Cheque_Favour_OF = await element.Payment_Option_TransactionSMSMobileNo;
                element.BankAccountName = await element.Payment_Option_BankAccountName;
                element.BankAccountNumber = await element.Payment_Option_BankAccountNumber;
                element.BankName = await element.Payment_Option_BankName;
                element.IFSCCODE = await element.Payment_Option_IFSCCODE;
                element.MICRCODE = await element.Payment_Option_MICRCODE;
                element.TransactionSMSMobileNo = await element.Payment_Option_TransactionSMSMobileNo;
                element.GSTNumber = await element.Payment_Option_GSTNumber;
                element.RentDueDate = await MssqldatetimeFormat(element.RentDueDate, 'DD/MM/YYYY');
                PropertyRentReminderEmail(element);
                PropertyRentReminderSMS(element)
            } catch (err) {
                var errMessage = `An error occurred during Send Property Rent Reminder Email or SMS`;
                APIErrorLog('spPOSTRentReminderEmail', { ...err }, req.headers, req.body, errMessage, req.method, req.params, req.query);
                return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            }

        })

        return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "Property Rent Reminder sent Successfully" }, new ResponseModel()));



    } catch (err) {
        var errMessage = `An error occurred during Send Property Rent Reminder`;
        APIErrorLog(spPOSTRentReminder, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }

}

router.get('/api/property/reminder/rent', GETPropertyRentReminder);

module.exports = router;
