const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

const SMSLog = require('../shared/SMSLog')

var TableName = 'tbl_Templates';
var TableName2 = 'tbl_usermaster';
const TemplateID = 12;

var LoanPVRGenrated = (UserID) => {

    return new Promise((resolve, reject) => {

        if (!UserID) resolve();

        var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE TemplateID = ${TemplateID}; Select * from ${TableName2} where UserID = ?`, [UserID])

        executeQuery(MsSqlQuery)
            .then(data => {

                var Template = data.recordset[0];
                var TempUser = data.recordsets[1];

                var { MobileNumber, FirstName, LastName, UserID } = { ...TempUser[0] }

                if (UserID) {
                    sendSMSBYSMSCountry(MobileNumber, Template.TemplateBody, OTPSMS.sid)
                        .then(result => {

                            SMSLog({
                                UserID: UserID,
                                MobileNumber: MobileNumber,
                                Name: FirstName ? FirstName + ' ' + LastName : null,
                                TemplateID: TemplateID,
                                SMSResponce: result.body
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
                                errMessage: `An error occurred during Sending SMS`,
                                error_code: 'SERVER_ERROR',
                                err
                            });
                        })
                }


            })
            .catch(err => {
                reject({
                    Name: MsSqlQuery,
                    errMessage: `An error occurred during Fetching SMS Template`,
                    error_code: 'SERVER_ERROR',
                    err
                });
            })

    })

}

module.exports = LoanPVRGenrated