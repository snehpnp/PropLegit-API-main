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
            const query = await SqlString.format(`Select Name as AuditName,Mobile,Email from TrusteeUsers WHERE TrusteeUsertypeID IN (2,3) AND TrustID = ${id}; 
            select TrustName From tbl_PropertyTrustMaster where TrustID = ${id};
            Select * From tbl_Templates Where TemplateID IN (45,46);
            Select Name as AuditName,Mobile,Email from TrusteeUsers WHERE TrusteeUserID = ${x.AuditUser}`);
            const run = await executeQuery(query);
            const record = await run.recordsets;
            const TrusteeUser = await record[0];
            let obj = {...record[1][0], ...x }
            var calllRcursive = await mailrecursive(TrusteeUser, record, obj, 0)
            console.log(calllRcursive.success)
            const objects = await Object.assign(x, record[3][0], record[1][0])
            await EmailCommonReminder(objects, record[2][0]).then(async() => {
                await SMSForReminder(record[2][1], objects)
            })

            let json = {
                DueDate: x.dueDate,
                FinYear: x.NextFinYear
            }
            return tmpArray.push(json)
        }
    }))
    return tmpArray;
}
var mailrecursive = (data, template, obj, index) => {
    return new Promise(async(resolve, reject) => {
        try {
            if (index < data.length) {
                const object = Object.assign(data[index], obj)
                const Email = await EmailCommonReminder(object, template[2][0])
                const SMS = await SMSForReminder(template[2][1], object)
                mailrecursive(data, template, obj, ++index).then(resolve)
            } else {
                resolve({ success: 'sa' });
            }

        } catch (error) {
            reject(error)
        }

    })
}
router.get('/api/trust/exemption/reminder/TrustID/:TrustID', getNotification);

module.exports = router