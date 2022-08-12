const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var { OTPEmail } = require('../config/db.js');
var sendmail = require('../Email/Email');

var TemplateTableName = 'tbl_Templates';
var UserMasterTableName = 'tbl_usermaster';

var emailLog = require('../shared/emailLog');

var TemplateID = 15;

var getEmailTemplateRecord = async() => {
    try{
        var MsSqlQuery = SqlString.format(`Select * from ${TemplateTableName} WHERE TemplateID = ${TemplateID}`);
        let queryData = await executeQuery(MsSqlQuery);
        return queryData.recordset[0];
    }
    catch(err){
        throw new Error(JSON.stringify({
            Name: MsSqlQuery,
            errMessage: `An error occurred during Fetching Email Template`,
            error_code: 'SERVER_ERROR',
            err
        }));
    }
}

var sendEmailToUser = async (templateData, userData) => {
    var body = templateData.TemplateBody.replace("[Name]", userData.FirstName);
    try{
        let emailResult = await sendmail(userData.EmailAddress, OTPEmail.From, OTPEmail.BCC, templateData.TemplateSubject, body)
        let result = await emailLog({
            UserID: userData.UserID,
            EmailTo: userData.EmailAddress,
            Name: userData.FirstName + ' ' + userData.LastName,
            TemplateID: templateData.TemplateID,
            EmailMessageID: emailResult.messageId
        })

        return result;
    }
    catch(err){
        throw new Error(JSON.stringify({
            Name: { "UserID": userData.UserID },
            errMessage: `An error occurred during Sending Public Notice Issued Email`,
            error_code: 'SERVER_ERROR',
            err
        }));
    }
}


module.exports = {
    getEmailTemplateRecord,
    sendEmailToUser
}