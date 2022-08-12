const sql = require('mssql');

const { runStoredProcedure } = require('../MsSql/Query');

var CurrentDateTime = require('./CurrentDateTime');

var spAddEmailLog = 'sp_POST_EmailLog';

var emailLog = (user) => {

    return new Promise((resolve, reject) => {
        var model = {
            UserID: user.UserID,
            EmailTo: user.EmailTo,
            Name: user.Name,
            TemplateID: user.TemplateID,
            EmailMessageID: user.EmailMessageID,
            EmailSentDatetime: CurrentDateTime()
        }

        var inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        runStoredProcedure(spAddEmailLog, inputparams)
            .then(result => {
                resolve(result.recordset);
            })
            .catch(err => {
                reject({
                    Name: spAddEmailLog,
                    errMessage: `An error occurred during  Email Log`,
                    error_code: 'SERVER_ERROR',
                    err
                });
            })
    });

}

module.exports = emailLog;