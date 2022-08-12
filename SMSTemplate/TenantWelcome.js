const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

const SMSLog = require('../shared/SMSLog')

var TableName = 'tbl_Templates';
var TableNameUser = 'tbl_usermaster';
var TableCompany = 'tblCompany_Master';
var TableTenant = 'tbl_PropertyTenant';
var TableProperty = `tbl_PropertyMaster`;

const TemplateID = 10;

var TenantWelcome = (PropertyTenantID, CreatedBy) => {

    return new Promise((resolve, reject) => {

        var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE TemplateID = ${TemplateID}; Select * from ${TableCompany} m
        left join ${TableNameUser} u
        on u.CompanyID = m.CompanyID
        where UserID = ?; SELECT t.*, p.PropertyName from ${TableTenant} t
        left join ${TableProperty} p
        on p.PropertyID = t.PropertyID
        where PropertyTenantID = ?`, [CreatedBy, PropertyTenantID])

        executeQuery(MsSqlQuery)
            .then(data => {

                var Template = data.recordset[0];
                var TempClients = data.recordsets[1];
                var TempUsers = data.recordsets[2];

                var body = Template.TemplateBody.replace("[ClientName]", TempClients[0].CompanyName);
                body = body.replace("[PropertyName]", TempUsers[0].PropertyName);

                sendSMSBYSMSCountry(TempUsers[0].TenantMobile, body, OTPSMS.sid)
                    .then(result => {
                        SMSLog({
                            UserID: null,
                            MobileNumber: TempUsers[0].TenantMobile,
                            Name: TempUsers[0].TenantName,
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

module.exports = TenantWelcome;