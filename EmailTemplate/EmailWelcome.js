const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPEmail } = require('../config/db.js');
var sendmail = require('../Email/Email');

var TableName = 'tbl_Templates';
var TableName2 = 'tbl_usermaster'

var emailLog = require('../shared/emailLog');

var TemplateID = 3;

var EmailWelcome = (UserID) => {

    return new Promise((resolve, reject) => {

        var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE TemplateID = ${TemplateID}; Select * from ${TableName2} where UserID = ?`, [UserID])

        executeQuery(MsSqlQuery)
            .then(data => {

                var Template = data.recordset[0];
                var TempUser = data.recordsets[1];
                var body = Template.TemplateBody.replace("[Name]", TempUser[0].FirstName);
                var body = body.replace("[emailID]", TempUser[0].EmailAddress);
                var body = body.replace("[MobileNo]", TempUser[0].MobileNumber);

                sendmail(TempUser[0].EmailAddress, OTPEmail.From, OTPEmail.BCC, Template.TemplateSubject, body)
                    .then(result => {

                        emailLog({
                            UserID: UserID,
                            EmailTo: TempUser[0].EmailAddress,
                            Name: TempUser[0].FirstName + ' ' + TempUser[0].LastName,
                            TemplateID: TemplateID,
                            EmailMessageID: result.messageId
                        })
                            .then(LogResult => {
                                resolve(result);
                            })
                            .catch(err => {
                                reject(err);
                            })
                    })
                    .catch(err => {
                        reject({
                            Name: { "UserID": UserID },
                            errMessage: `An error occurred during Sending Email`,
                            error_code: 'SERVER_ERROR',
                            err
                        });
                    })
            })
            .catch(err => {
                reject({
                    Name: MsSqlQuery,
                    errMessage: `An error occurred during Fetching Email Template`,
                    error_code: 'SERVER_ERROR',
                    err
                });
            })

    })

}


module.exports = EmailWelcome