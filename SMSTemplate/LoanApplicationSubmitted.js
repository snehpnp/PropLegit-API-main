const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPSMS, internal_team_of_LoanApp } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

const SMSLog = require('../shared/SMSLog')

var TableName = 'tbl_Templates';
var TableName2 = 'tbl_usermaster';
const TemplateID = 11;

var SMSLoanApplicationSubmitted = (UserID) => {

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

const SendinternalteamSMS = () => {

    return new Promise(async (resolve, reject) => {

        var MsSqlQuery = await SqlString.format(`Select * from ${TableName} WHERE TemplateID = ${TemplateID};`)

        try {

            const data = await executeQuery(MsSqlQuery);

            var Template = data.recordset[0];

            try {

                var MobileNoArray = await [...internal_team_of_LoanApp.SMS];

                const sendSMS = await sendSMSBYSMSCountry(MobileNoArray.join(','), Template.TemplateBody, OTPSMS.sid)

                resolve(sendSMS.body)

            } catch (err) {

                reject({
                    Name: { "UserID": null },
                    errMessage: `An error occurred during Sending SMS`,
                    error_code: 'SERVER_ERROR',
                    err
                });
            }


        } catch (err) {
            reject({
                Name: MsSqlQuery,
                errMessage: `An error occurred during Fetching SMS Template`,
                error_code: 'SERVER_ERROR',
                err
            });
        }
    })

}

module.exports = { SMSLoanApplicationSubmitted, SendinternalteamSMS }