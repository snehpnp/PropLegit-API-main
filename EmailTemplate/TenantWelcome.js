const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');
const ejs = require("ejs");

var { OTPEmail } = require('../config/db.js');
var sendmail = require('../Email/Email');

var TableName = 'tbl_Templates';
var TableNameUser = 'tbl_usermaster';
var TableCompany = 'tblCompany_Master';
var TableTenant = 'tbl_PropertyTenant';
var TablePropertyDetails = `tbl_PropertyOtherDetails`

var emailLog = require('../shared/emailLog');

var TemplateID = 9;

var TenantWelcome = (PropertyTenantID, CreatedBy) => {


    return new Promise(async (resolve, reject) => {

        var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE TemplateID = ${TemplateID}; Select * from ${TableCompany} m
        left join ${TableNameUser} u
        on u.CompanyID = m.CompanyID
        where UserID = ?; SELECT t.*, p.PostalAddress from ${TableTenant} t
        left join ${TablePropertyDetails} p
        on p.PropertyID = t.PropertyID
        where PropertyTenantID = ?`, [CreatedBy, PropertyTenantID])


        try {

            const data = await executeQuery(MsSqlQuery);

            var Template = await data.recordset[0];
            var TempClients = await data.recordsets[1];
            var TempUsers = await data.recordsets[2];

            var { CompanyName } = await { ...TempClients[0] }

            var { TenantName, PostalAddress, MonthlyORDailyRent, RentDueDay, Cheque_Favour_OF, BankAccountName, BankAccountNumber, BankName, IFSCCODE, MICRCODE, TransactionSMSMobileNo, TenantEmail } = await { ...TempUsers[0] }

            const { TemplateSubject, TemplateBody } = await { ...Template }


            const Subject = await ejs.render(TemplateSubject, {
                ClientName: CompanyName
            }, { async: true });

            const body = await ejs.render(TemplateBody, {
                TenantName,
                ClientName: CompanyName, PropertyAddress: PostalAddress, RentAmount: MonthlyORDailyRent,
                DueDateForRent: `Every Month ${RentDueDay} Date`, Cheque_Favour_OF,
                BankAccountName, BankAccountNumber, BankName, IFSCCODE, MICRCODE, TransactionSMSMobileNo

            }, { async: true });

            const result = await sendmail(TenantEmail, OTPEmail.From, OTPEmail.BCC, Subject, body);

            const LogResult = await emailLog({
                UserID: null,
                EmailTo: TenantEmail,
                Name: TenantName,
                TemplateID: TemplateID,
                EmailMessageID: result.messageId
            })

            resolve(result);

        } catch (err) {

            reject({
                Name: MsSqlQuery,
                errMessage: `An error occurred during Fetching Email Template`,
                error_code: 'SERVER_ERROR',
                err
            });
        }

    })
}

module.exports = TenantWelcome