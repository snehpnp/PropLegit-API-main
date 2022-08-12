const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

var TableProperty = 'tbl_PropertyMaster';
var TableUser = 'tbl_UserMaster';
var ViewArea = 'view_Area';
var TableReminder = `tbl_PropertyReminder`;

var ReminderLog = require('../shared/emailReminderLog');

var PropertyTaxReminder = (object) => {

    return new Promise((resolve, reject) => {

        var { PropertyTaxID, PropertyID, UserID, BeforeDays, DueDate } = { ...object };

        var d = new Date(DueDate);
        DueDate = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear()

        var MsSqlQuery = SqlString.format(`
        Select * from ${TableProperty} where PropertyID = ?;
        Select * from ${TableUser} where UserID = ?;
        Select Top 1 DistrictName as Area
            from ${ViewArea} where 
            VillageID = (Select Top 1 VillageID from ${TableProperty} where PropertyID = ?);
        Select Top 1 * from ${TableReminder} where ReminderFor = 'Property Tax' AND TemplateType = 'SMS'
        AND ( Days = ? OR Days IS  NULL)`, [PropertyID, UserID, PropertyID, BeforeDays])

        executeQuery(MsSqlQuery)
            .then(data => {

                var Property = data.recordsets[0] ? (data.recordsets[0])[0] : null;
                var User = data.recordsets[1] ? (data.recordsets[1])[0] : null;
                var PropertyDetails = data.recordsets[2] ? (data.recordsets[2])[0] : null;
                var Template = data.recordsets[3] ? (data.recordsets[3])[0] : null;

                var { ReminderID, TemplateSubject, TemplateBody } = { ...Template };

                var { UserID, FirstName, LastName, EmailAddress, MobileNumber } = { ...User };
                var Name = FirstName + ' ' + LastName;

                var { Area } = { ...PropertyDetails };

                var { SurveyNo } = { ...Property };

                var body = TemplateBody.replace("[Date]", DueDate);
                body = body.replace("[District]", Area);
                body = body.replace("[SurveyNumber]", SurveyNo);

                sendSMSBYSMSCountry(MobileNumber, body, OTPSMS.sid)
                    .then(result => {

                        ReminderLog({
                            ReminderID: ReminderID,
                            PropertyID: PropertyID,
                            UserID: UserID,
                            Name: Name,
                            Email: EmailAddress,
                            Mobile: MobileNumber,
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
                            Name: { "PropertyTaxID": PropertyTaxID },
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

module.exports = PropertyTaxReminder