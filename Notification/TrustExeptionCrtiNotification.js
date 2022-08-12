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

var Spgetexmptionnotification = `sp_GET_Trust_ExemCerti_Notification`;

var getNotification = async(req, res) => {
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
        const MasterData = await runStoredProcedure(Spgetexmptionnotification, inputparams);
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
            message: "Trust exemption Notification Data successfully Fetched"
        }, new ResponseModel()));
    } catch (err) {
        console.log('err: ', err);
        var errMessage = `An error occurred during Fetching Trust exemption Alerts Data`;
        APIErrorLog(Spgetexmptionnotification, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}
var STructureData = async(data, id) => {
    const tmpArray = []
    await Promise.all(data.map(async(x) => {
        if (x.NextfinyearDocumentID == null) {
            let json = {
                DueDate: x.dueDate,
                FinYear: x.NextFinYear
            }
            return tmpArray.push(json)
        }
    }))
    return tmpArray;
}
router.get('/api/trust/exemption/notification/TrustID/:TrustID', getNotification);

module.exports = router