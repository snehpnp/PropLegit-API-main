const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPEmail } = require('../config/db.js');
var sendmail = require('../Email/Email');

var TableTax = 'tbl_PropertyTax';
var TableProperty = 'tbl_PropertyMaster';
var TableUser = 'tbl_UserMaster';
var ViewArea = 'view_Area';
var TableReminder = `tbl_PropertyReminder`;

var emailReminderLog = require('../shared/emailReminderLog');

var PropertyTaxReminder = (object) => {

    return new Promise((resolve, reject) => {

        var { PropertyTaxID, FinancialTaxYear, PropertyID, UserID, BeforeDays, DueDate } = { ...object };

        var d = new Date(DueDate);
        DueDate = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear()

        var MsSqlQuery = SqlString.format(`
        Select AmountPay as LastAmountPay, CONVERT(varchar, PaymentDate, 6) as LastYearPaymentDate from ${TableTax} where FinancialTaxYear = dbo.ufnGetLastFinancialTaxYear(?) AND
        PropertyTaxTypeID = (Select PropertyTaxTypeID From tbl_PropertyTax
		where PropertyTaxID = ?) AND PropertyID = ?;
        Select * from ${TableProperty} where PropertyID = ?;
        Select * from ${TableUser} where UserID = ?;
        Select Top 1 VillageName, TalukaName , DistrictName
            from ${ViewArea} where 
            VillageID = (Select Top 1 VillageID from ${TableProperty} where PropertyID = ?);
        Select Top 1 * from ${TableReminder} where ReminderFor = 'Property Tax' AND TemplateType = 'Email'
        AND ( Days = ? OR Days IS  NULL)`, [FinancialTaxYear, PropertyTaxID, PropertyID, PropertyID, UserID, PropertyID, BeforeDays])

        executeQuery(MsSqlQuery)
            .then(data => {

                var PropertyLastTax = data.recordsets[0] ? (data.recordsets[0])[0] : null;
                var Property = data.recordsets[1] ? (data.recordsets[1])[0] : null;
                var User = data.recordsets[2] ? (data.recordsets[2])[0] : null;
                var PropertyDetails = data.recordsets[3] ? (data.recordsets[3])[0] : null;
                var Template = data.recordsets[4] ? (data.recordsets[4])[0] : null;

                var { ReminderID, TemplateSubject, TemplateBody } = { ...Template };

                var { UserID, FirstName, LastName, EmailAddress, MobileNumber } = { ...User };
                var Name = FirstName + ' ' + LastName;

                var { VillageName, TalukaName, DistrictName } = { ...PropertyDetails };

                var { RevenewOfficeType, CitySurveyOffice, CityWardNo, SurveyNo, CitySurveyNo, SurveyNo, FPNo, TPNo, RevenewOfficeType } = { ...Property };

                var { LastAmountPay, LastYearPaymentDate } = { ...PropertyLastTax };

                var body = TemplateBody.replace("[CreatedBy]", Name);
                body = body.replace("[RevenewOfficeType]", RevenewOfficeType);
                body = body.replace("[RevenewOfficeType]", RevenewOfficeType);
                body = body.replace("[DueDate]", DueDate);
                body = body.replace("[VillageName]", VillageName);
                body = body.replace("[TalukaName]", TalukaName);
                body = body.replace("[DistrictName]", DistrictName);
                // body = body.replace("[Area]", Area);
                body = body.replace("[CitySurveyOffice]", CitySurveyOffice ? CitySurveyOffice : '');
                body = body.replace("[CityWardNo]", CityWardNo ? CityWardNo : '');
                body = body.replace("[SurveyNo]", SurveyNo ? SurveyNo : '');
                body = body.replace("[CitySurveyNo]", CitySurveyNo ? CitySurveyNo : '');
                body = body.replace("[SurveyNo]", CityWardNo ? CityWardNo : '');
                body = body.replace("[FPNo]", FPNo ? FPNo : '');
                body = body.replace("[TPNo]", TPNo ? TPNo : '');
                body = body.replace("[LastAmountPay]", LastAmountPay ? LastAmountPay : '');
                body = body.replace("[LastYearPaymentDate]", LastYearPaymentDate ? LastYearPaymentDate : '');

                sendmail(EmailAddress, OTPEmail.From, OTPEmail.BCC, TemplateSubject, body)
                    .then(result => {

                        emailReminderLog({
                            ReminderID: ReminderID,
                            PropertyID: PropertyID,
                            UserID: UserID,
                            Name: Name,
                            Email: EmailAddress,
                            Mobile: MobileNumber,
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
                            Name: { "PropertyTaxID": PropertyTaxID },
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

module.exports = PropertyTaxReminder