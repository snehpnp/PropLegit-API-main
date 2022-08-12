const sql = require('mssql');

const { runStoredProcedure } = require('../MsSql/Query');

var CurrentDateTime = require('./CurrentDateTime');

var spEmailReminderLog = 'sp_POST_Reminder_Log';

var emailReminderLog = (user) => {

    return new Promise((resolve, reject) => {
        var model = {
            ReminderID: user.ReminderID,
            PropertyID: user.PropertyID,
            UserID: user.UserID,
            Name: user.Name,
            Email: user.Email,
            Mobile: user.Mobile,
            EmailMessageID: user.EmailMessageID,
            SMSResponce: user.SMSResponce,
            SentDatetime: CurrentDateTime()
        }

        var inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        runStoredProcedure(spEmailReminderLog, inputparams)
            .then(result => {
                resolve(result.recordset);
            })
            .catch(err => {
                reject({
                    Name: spEmailReminderLog,
                    errMessage: `An error occurred during  Email Reminder Log`,
                    error_code: 'SERVER_ERROR',
                    err
                });
            })
    });

}

module.exports = emailReminderLog;