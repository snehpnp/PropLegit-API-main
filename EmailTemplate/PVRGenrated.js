const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPEmail } = require('../config/db.js');
var sendmail = require('../Email/Email');

var TableName = 'tbl_Templates';
var TableName2 = 'tbl_usermaster'
const vwDocument = 'view_PropertyDocument';

var emailLog = require('../shared/emailLog');

var TemplateID = 13;

var PVRGenrated = (UserID, DocumentID) => {


    return new Promise((resolve, reject) => {

        if (!UserID) resolve();

        var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE TemplateID = ${TemplateID}; Select * from ${TableName2} where UserID = ?;Select FileURL from  ${vwDocument} where DocumentID = ?`, [UserID, DocumentID])

        executeQuery(MsSqlQuery)
            .then(data => {

                var Template = data.recordset[0];
                var TempUser = data.recordsets[1];
                var Document = data.recordsets[2];

                var { UserID } = { ...TempUser[0] }

                if (UserID) {

                    var body = Template.TemplateBody.replace("[Name]", TempUser[0].FirstName);
                    attachmentsArray = [{
                        // use URL as an attachment
                        filename: 'Preliminary Verification Report.PDF',
                        path: Document[0].FileURL
                    }]

                    sendmail(TempUser[0].EmailAddress, OTPEmail.From, OTPEmail.BCC, Template.TemplateSubject, body, attachmentsArray)
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
                                errMessage: `An error occurred during Sending PVR Email`,
                                error_code: 'SERVER_ERROR',
                                err
                            });
                        })
                }
            })
            .catch(err => {
                reject({
                    Name: MsSqlQuery,
                    errMessage: `An error occurred during Fetching PVR Email Template`,
                    error_code: 'SERVER_ERROR',
                    err
                });
            })

    })

}

module.exports = PVRGenrated