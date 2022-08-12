const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

const SMSLog = require('../shared/SMSLog')

var TemplateTableName = 'tbl_Templates';
var UserMasterTableName = 'tbl_usermaster';
const TemplateID = 14;

var getSmsTemplateRecord = async() => {
    try{
        var MsSqlQuery = SqlString.format(`Select * from ${TemplateTableName} WHERE TemplateID = ${TemplateID}`);
        let queryData = await executeQuery(MsSqlQuery);
        return queryData.recordset[0];
    }
    catch(err){
        throw new Error(JSON.stringify({
            Name: MsSqlQuery,
            errMessage: `An error occurred during Fetching SMS Template`,
            error_code: 'SERVER_ERROR',
            err
        }));
    }
}

var sendSmsToUser = async (templateData, userData) => {
    try{
        let smsResult = await sendSMSBYSMSCountry(userData.MobileNumber, templateData.TemplateBody, OTPSMS.sid);
        let result = await SMSLog({
            UserID: userData.UserID,
            MobileNumber: userData.MobileNumber,
            Name: userData.FirstName ? userData.FirstName + ' ' + userData.LastName : null,
            TemplateID: templateData.TemplateID,
            SMSResponce: smsResult.body
        });

        return result;
    }
    catch(err){
        throw new Error(JSON.stringify({
            Name: { "UserID": userData.UserID },
            errMessage: `An error occurred during Sending Public Notice Issued SMS`,
            error_code: 'SERVER_ERROR',
            err
        }));
    }
}

module.exports = {
    getSmsTemplateRecord,
    sendSmsToUser
}