const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

const SMSLog = require('../shared/SMSLog')

var TableName = 'tbl_Templates';
var TableName2 = 'tbl_usermaster';
const TemplateID = 4;

var SMSWelcome = (UserID) => {

    return new Promise((resolve, reject) => {

        var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE TemplateID = ${TemplateID}; Select * from ${TableName2} where UserID = ?`, [UserID])

        executeQuery(MsSqlQuery)
            .then(data => {

                var Template = data.recordset[0];
                var TempUser = data.recordsets[1];

                sendSMSBYSMSCountry(TempUser[0].MobileNumber, Template.TemplateBody, OTPSMS.sid)
                    .then(result => {

                        SMSLog({
                            UserID: UserID,
                            MobileNumber: TempUser[0].MobileNumber,
                            Name: TempUser[0].MobileNumber.FirstName ? TempUser[0].MobileNumber.FirstName + ' ' + TempUser[0].MobileNumber.LastName : null,
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


module.exports = SMSWelcome