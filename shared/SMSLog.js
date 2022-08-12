const sql = require('mssql');

const { runStoredProcedure } = require('../MsSql/Query');

var CurrentDateTime = require('./CurrentDateTime');

var spAddSMSLog = 'sp_POST_SMSLog';

var SMSLog = (user) => {

    return new Promise((resolve, reject) => {
        var model = {
            UserID: user.UserID,
            MobileNumber: user.MobileNumber,
            Name: user.Name,
            TemplateID: user.TemplateID,
            SMSResponce: user.SMSResponce,
            SMSSentDatetime: CurrentDateTime()
        }

        var inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        runStoredProcedure(spAddSMSLog, inputparams)
            .then(result => {
                resolve(result.recordset);
            })
            .catch(err => {
                reject({
                    Name: spAddSMSLog,
                    errMessage: `An error occurred during SMS Log`,
                    error_code: 'SERVER_ERROR',
                    err
                });
            })
    });

}

module.exports = SMSLog;