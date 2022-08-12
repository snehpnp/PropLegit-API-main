var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');
const moment = require('moment');

const { runStoredProcedure, executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
const CurrentDateTime = require('../shared/CurrentDateTime');

var spNPODashboard = `sp_View_NPO_Dashboard`;

var GETNPODashboard = async (req, res) => {

    var { UserID, AfterDays } = await { ...req.params };
    var { StateID } = await { ...req.query };

    AfterDays = +AfterDays;
    UserID = +UserID;
    StateID = +StateID;

    if (StateID == 0) StateID = null;

    if (!AfterDays || !UserID || AfterDays < 1 || UserID < 1 || (StateID && StateID < 1)) {
        var errMessage = `please pass numeric values for AfterDays or UserID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    const todaydate = await CurrentDateTime();
    var FilterDate = moment(todaydate, "YYYY-MM-DD HH:mm").add(AfterDays, 'days').format('YYYY-MM-DD HH:mm');

    var model = await { FilterDate, UserID, StateID };
    var outputmodel = await { PropertyCount: null, OngoingCaseCount: null, DisposedCaseCount: null }

    var inputparams = [];

    await Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {

        const DashboardResult = await runStoredProcedure(spNPODashboard, inputparams);
        const MasterDate = await DashboardResult.recordsets;
        const companyinfo = await MasterDate[0];
        const Userinfo = await MasterDate[1]
        const dashboardinfo = await MasterDate[2];

        res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: {
                companyinfo,
                Userinfo,
                dashboardinfo
            }, message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching Area List`;
        APIErrorLog(spNPODashboard, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var GETNPODashboardAfterDaysList = async (req, res) => {

    const DasyList = await [{
        "value": 15,
        "lable": "Next 15 days"
    }, {
        "value": 30,
        "lable": "Next 30 days"
    }, {
        "value": 45,
        "lable": "Next 45 days"
    }, {
        "value": 60,
        "lable": "Next 60 days"
    }, {
        "value": 90,
        "lable": "Next 90 days"
    }, {
        "value": 120,
        "lable": "Next 120 days"
    }]

    res.status(200).send(new modelBuilder().buildModel({ status: 200, data: DasyList, message: "data successfully Fetched" }, new ResponseModel()));

}

var GETFinancialYearList = async (req, res) => {

    const MsSqlQuery = SqlString.format(`Select * from [dbo].[ufTableOfFinancialYear]()`);

    try {

        const YearData = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: YearData.recordset, message: "Financial Year successfully Fetched" }, new ResponseModel()));


    } catch (err) {
        var errMessage = `An error occurred during Fetching Financial Year List`;
        APIErrorLog(spNPODashboard, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.get('/api/FinancialYear/list', GETFinancialYearList);

router.get('/api/property/dashboard/count/:UserID/:AfterDays', GETNPODashboard);
router.get('/api/property/dashboard/AfterDays/list', GETNPODashboardAfterDaysList);

module.exports = router;