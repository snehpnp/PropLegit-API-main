const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');
const moment = require('moment');

var { OTPEmail } = require('../config/db.js');
var sendmail = require('../Email/Email');

var TableName = 'tbl_Templates';
var TableTenant = 'tbl_PropertyTenant';
var TableRent = `tbl_PropertyRent`;
const vwDocument = 'view_PropertyDocument';

var emailLog = require('../shared/emailLog');

var TemplateID = 16;

var EmailRentReceipt = (PropertyRentID, { RentStartMonth, RentEndMonth }) => {
    return new Promise((resolve, reject) => {

        var MsSqlQuery = SqlString.format(`Select * from ${TableName} 
        WHERE TemplateID = ${TemplateID}; 
        Select * from ${TableTenant} 
        where PropertyTenantID = (Select PropertyTenantID  from ${TableRent}
            where PropertyRentID = ?);
            Select *  from ${TableRent}
            where PropertyRentID = ?;
            Select FileURL from  ${vwDocument} where DocumentID = (Select ReceiptDocumentID  from ${TableRent}
            where PropertyRentID = ?)`, [PropertyRentID, PropertyRentID, PropertyRentID])

        executeQuery(MsSqlQuery)
            .then(data => {

                var Template = data.recordset[0];
                var Tenant = data.recordsets[1];
                var Rent = data.recordsets[2];
                var Document = data.recordsets[3];

                var { TemplateID, TemplateBody, TemplateSubject } = { ...Template }

                var { PropertyTenantID, TenantName, TenantEmail, RentDuration, RentBasedOn } = { ...Tenant[0] }

                var { AmountPay, ModeOfPayment, RentStartMonthORDate, RentEndMonthORDate } = { ...Rent[0] }

                var body = TemplateBody.replace("[TenantName]", TenantName);
                body = body.replace("[AmountPay]", AmountPay != null ? AmountPay : 0);
                body = body.replace("[ModeOfPayment]", ModeOfPayment);
                body = body.replace('[RentStartMonthORDate]', moment(RentStartMonth, 'YYYY - MM - DDTHH: mm: ss').format('MMMM - YYYY'));
                body = body.replace('[RentEndMonthORDate]', moment(RentEndMonth, 'YYYY - MM - DDTHH: mm: ss').format('MMMM - YYYY'));
                body = body.replace("[RentDuration]", RentDuration);
                body = body.replace("[RentBasedOn]", RentBasedOn);
                var attachmentsArray = [];

                if (Document.length > 0) {
                    attachmentsArray = [{
                        // use URL as an attachment
                        filename: 'Receipt.PDF',
                        path: Document[0].FileURL
                    }]
                }

                sendmail(TenantEmail, OTPEmail.From, OTPEmail.BCC, TemplateSubject, body, attachmentsArray)
                    .then(result => {

                        emailLog({
                            UserID: null,
                            EmailTo: TenantEmail,
                            Name: TenantName,
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
                            Name: { "PropertyTenantID": PropertyTenantID },
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



module.exports = EmailRentReceipt;