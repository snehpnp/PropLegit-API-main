const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

var TableName = 'tbl_Templates';

var SMSLog = require('../shared/SMSLog');

var SMSOTP = (element, ID) => {

    return new Promise((resolve, reject) => {

        var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE TemplateID = ?`, [ID])

        executeQuery(MsSqlQuery)
            .then(data => {

                var Template = data.recordset[0];

                var body = Template.TemplateBody.replace("[OTP]", element.OTP);

                sendSMSBYSMSCountry(element.MobileNumber, body, OTPSMS.sid)
                    .then(result => {


                        SMSLog({
                            UserID: element.UserID,
                            MobileNumber: element.MobileNumber,
                            Name: element.FirstName ? element.FirstName + ' ' + element.LastName : null,
                            TemplateID: ID,
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
                            Name: { "UserID": element.UserID },
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


module.exports = SMSOTP