const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');
const moment = require('moment');

var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

const SMSLog = require('../shared/SMSLog')

var TableName = 'tbl_Templates';
var TableNameUser = 'tbl_usermaster';
var TableCompany = 'tblCompany_Master';
var TableTenant = 'tbl_PropertyTenant';
var TableProperty = `tbl_PropertyMaster`;
var TableRent = `tbl_PropertyRent`;

const TemplateID = 17;

var SMSRentReceipt = (PropertyRentID, { RentStartMonth, RentEndMonth }) => {

    return new Promise((resolve, reject) => {

        var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE TemplateID = ${TemplateID}; Select t.*, r.PropertyRentID, r.RentDueDate, r.RentAmount, r.RentStartMonthORDate, r.RentEndMonthORDate, r.ReceiptDocumentID, r.PaymentDate, r.AmountPay, r.ChequeNo, r.ChequeName, r.BankName, r.BankBranchName, r.TransactionID, r.WalletName, r.ModeOfPayment, p.PropertyName, c.CompanyID, 
			c.CompanyName, c.BankName, c.BankAccountName, c.GSTNumber, c.BankAccountNumber,
			 c.IFSCCODE, c.MICRCODE, c.TransactionSMSMobileNo, c.Cheque_Favour_OF,
			 c.CompanyAddress
			from ${TableTenant} t
			left join ${TableRent} r on r.PropertyTenantID = t.PropertyTenantID
			left join ${TableProperty} p on p.PropertyID = t.PropertyID
			left join ${TableNameUser} u on u.UserID = t.CreatedBy
			left join ${TableCompany} c on c.CompanyID = u.CompanyID
			where PropertyRentID = ?`, [PropertyRentID])

        executeQuery(MsSqlQuery)
            .then(data => {

                var Template = data.recordset[0];
                var TenantRent = data.recordsets[1];

                var { TemplateBody, TemplateID } = { ...Template }

                var { CompanyName, AmountPay, RentDuration, RentBasedOn, PropertyName, TenantMobile, TenantName, PropertyTenantID } = { ...TenantRent[0] }

                var body = TemplateBody.replace("[CompanyName]", CompanyName);
                body = body.replace("[AmountPay]", AmountPay);
                body = body.replace('[RentStartMonthORDate]', moment(RentStartMonth, 'YYYY - MM - DDTHH: mm: ss').format('DD/MM/YYYY'));
                body = body.replace('[RentEndMonthORDate]', moment(RentEndMonth, 'YYYY - MM - DDTHH: mm: ss').format('DD/MM/YYYY'));
                body = body.replace("[RentDuration]", RentDuration);
                body = body.replace("[RentBasedOn]", RentBasedOn);
                body = body.replace("[PropertyName]", PropertyName);



                sendSMSBYSMSCountry(TenantMobile, body, OTPSMS.sid)
                    .then(result => {

                        SMSLog({
                            UserID: null,
                            MobileNumber: TenantMobile,
                            Name: TenantName,
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
                            Name: { "PropertyTenantID": PropertyTenantID },
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

module.exports = SMSRentReceipt