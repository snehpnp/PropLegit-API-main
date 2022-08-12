const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPEmail } = require('../config/db.js');
var sendmail = require('../Email/Email');

var TableName = 'tbl_Templates';
var TableName2 = 'tbl_usermaster'

const emailLog = require('../shared/emailLog');

var EmailOTP = (element, tempID) => {

    return new Promise((resolve, reject) => {

        var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE TemplateID = ?; Select * from ${TableName2} where UserID = ?`, [tempID, element.UserID])

        executeQuery(MsSqlQuery)
            .then(data => {

                var Template = data.recordset[0];
                var body = Template.TemplateBody.replace("[OTP]", element.OTP);

                var TempUser = data.recordsets[1];
                var body = body.replace("[Name]", TempUser[0].FirstName)

                sendmail(element.EmailAddress, OTPEmail.From, OTPEmail.BCC, Template.TemplateSubject, body)
                    .then(result => {

                        emailLog({
                            UserID: element.UserID,
                            EmailTo: element.EmailAddress,
                            Name: TempUser[0].FirstName + ' ' + TempUser[0].LastName,
                            TemplateID: tempID,
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
                            Name: { "UserID": element.UserID },
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


module.exports = EmailOTP