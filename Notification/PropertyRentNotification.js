var router = require('express').Router();
const sql = require('mssql');

const { runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var CurrentDateTime = require('../shared/CurrentDateTime');

var spViewPropertyRentNotification = `sp_View_PropertyRent_Notification`;

var GETPropertyRentNotification = async (req, res) => {

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

        const MasterData = await runStoredProcedure(spViewPropertyRentNotification, inputparams);
        const Notification = await MasterData.recordsets;

        res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: {
                "DueDate_between_30_16": Notification[0],
                "DueDate_between_15_8": Notification[1],
                "DueDate_between_7_1": Notification[2],
                "DueDate_Today": Notification[3],
                "DueDate_Past": Notification[4]
            }, message: "Property Rent Notification Data successfully Fetched"
        }, new ResponseModel()));



    } catch (err) {
        var errMessage = `An error occurred during Fetching Property Rent Notification Data`;
        APIErrorLog(spViewPropertyRentNotification, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

router.get('/api/property/rent/notification/User/:UserID', GETPropertyRentNotification);
router.get('/api/property/rent/notification/Property/:PropertyID', GETPropertyRentNotification);

module.exports = router;
