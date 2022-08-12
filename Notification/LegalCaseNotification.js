var router = require('express').Router();
const sql = require('mssql');

const { runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var CurrentDateTime = require('../shared/CurrentDateTime');

var legal_Case_notification = `sp_View_legal_Case_notification`;

var GETPropertylegalCaseNotification = async (req, res) => {

    var date = CurrentDateTime();

    var { UserID = null, PropertyID = null } = await { ...req.params }

    var model = await { UserID, TodayDate: date, PropertyID }

    var inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {

        const MasterData = await runStoredProcedure(legal_Case_notification, inputparams);
        const Notification = await MasterData.recordsets;

        res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: {
                "DueDate_between_30_16": Notification[0],
                "DueDate_between_15_8": Notification[1],
                "DueDate_between_7_1": Notification[2],
                "DueDate_Today": Notification[3],
                "DueDate_Past": Notification[4]
            }, message: "Property Legal Case Notification Data successfully Fetched"
        }, new ResponseModel()));


    } catch (err) {
        var errMessage = `An error occurred during Fetching Property Legal case Notification Data`;
        APIErrorLog(legal_Case_notification, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }

}

router.get('/api/property/legalCase/notification/User/:UserID', GETPropertylegalCaseNotification);
router.get('/api/property/legalCase/notification/Property/:PropertyID', GETPropertylegalCaseNotification);

module.exports = router;
