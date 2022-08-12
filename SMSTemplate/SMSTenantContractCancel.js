
const ejs = require("ejs");
var { OTPSMS } = require('../config/db.js');
var sendSMSBYSMSCountry = require('../SMS/smscountry');

const SMSLog = require('../shared/SMSLog')


var SMSTenantContractCancel = (TenantInfo, bodydata, smsTemplateInfo) => {

    return new Promise(async (resolve, reject) => {

        const { TenantName, TenantMobile } = await { ...TenantInfo }

        const { TemplateID, TemplateBody } = await { ...smsTemplateInfo };

        bodydata.PropertyAddress = await (bodydata.PropertyAddress && bodydata.PropertyAddress.length > 25) ? bodydata.PropertyAddress.Substring(0, 25) + '...' : bodydata.PropertyAddress

        try {

            const body = await ejs.render(TemplateBody, bodydata, { async: true });

            var sendSMSResult = await sendSMSBYSMSCountry(TenantMobile, body, OTPSMS.sid);

            var LogResult = await SMSLog({
                UserID: null,
                MobileNumber: TenantMobile,
                Name: TenantName,
                TemplateID: TemplateID,
                SMSResponce: sendSMSResult.body
            })


            resolve(sendSMSResult);
        } catch (err) {
            reject(err);
        }

    })

}

module.exports = SMSTenantContractCancel;