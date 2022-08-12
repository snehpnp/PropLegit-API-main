var router = require('express').Router();
const sql = require('mssql');

const { runStoredProcedure, executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');
var SqlString = require('sqlstring');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var CurrentDateTime = require('../shared/CurrentDateTime');
const EmailCommonReminder = require('../EmailTemplate/EmailCommonTrustReminder');
const SMSForReminder = require('../SMSTemplate/CommonSMSTrustReminder');

var spgetTrustFundNotification = `get_trust_fund_notification`;

var GETTrustFundNotification = async(req, res) => {

    var date = CurrentDateTime();

    var { TrustID } = await {...req.params }

    var model = await { id: TrustID, TodayDate: date }

    var inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {
        const MasterData = await runStoredProcedure(spgetTrustFundNotification, inputparams);
        console.log('MasterData: ', MasterData);
        const Notification = await MasterData.recordsets;
        // const noti1 = await STructureData(Notification[1])
        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: {
                "DueDate_between_30_16": await STructureData(Notification[0], TrustID),
                "DueDate_between_15_8": await STructureData(Notification[1], TrustID),
                "DueDate_between_7_1": await STructureData(Notification[2], TrustID),
                "DueDate_Today": await STructureData(Notification[3], TrustID),
                "DueDate_Past": await STructureData(Notification[4], TrustID)
            },
            message: "Trust fund Notification Data successfully Fetched"
        }, new ResponseModel()));
    } catch (err) {
        console.log('err: ', err);
        var errMessage = `An error occurred during Fetching Trust Fund Alerts Data`;
        APIErrorLog(spgetTrustFundNotification, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }

}
var STructureData = async(data, TrustID) => {
    return new Promise(async(resolve, reject) => {
        try {
            const tmpArray = []
                // console.log('run: ', object);
            await Promise.all(data.map(async(x) => {
                if (x.nextFinYeardata == null) {
                    let json = {
                        FinYear: x.NextFinYear,
                        DueDate: x.dueDate,
                        FundAmount: x.nextFinYeardataAmount,
                        FundRegisterDate: x.nextFinYeardataRegistrationDate
                    }
                    return tmpArray.push(json)
                }
            }))
            resolve(tmpArray)
        } catch (error) {
            reject(error)
        }
    })
}
router.get('/api/trust/fund/notification/TrustID/:TrustID', GETTrustFundNotification);


module.exports = router;