var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');
const moment = require('moment');

const { runStoredProcedure, executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');
const Paginning_Serch_Sorting = require('../shared/Paginning_Serch_Sorting');
const CurrentDateTime = require('../shared/CurrentDateTime');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var sp_GET_Property_Tax_Count_VTDS = `sp_GET_Property_Tax_Count_VTDS`;
var sp_GET_Property_Tax_List_By_UserID = `sp_GET_Property_Tax_List_By_UserID`;
var ViewTax = 'View_PropertyTax';

var GETpropertyTaxCountByUser = async (req, res) => {

    var { UserID, AfterDays } = await { ...req.params };
    var { StateID } = { ...req.query };

    AfterDays = +AfterDays;
    UserID = +UserID;
    StateID = +StateID;

    if (StateID == 0) StateID = null;

    if (!AfterDays || !UserID || AfterDays < 1 || UserID < 1) {
        var errMessage = `please pass numeric values for AfterDays or UserID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    const todaydate = await CurrentDateTime();
    var FilterDate = moment(todaydate, "YYYY-MM-DD HH:mm").add(AfterDays, 'days').format('YYYY-MM-DD HH:mm');


    var inputparams = [];

    inputparams.push({
        "name": 'UserID',
        "type": sql.BigInt,
        "value": UserID
    }, {
        "name": 'CurrentDateTime',
        "type": sql.VarChar(100),
        "value": FilterDate
    }, {
        "name": 'StateID',
        "type": sql.BigInt,
        "value": StateID
    })

    try {

        var result = await runStoredProcedure(sp_GET_Property_Tax_Count_VTDS, inputparams);
        var countryWise = await result.recordsets[0];
        var statewise = await result.recordsets[1];
        var districtwise = await result.recordsets[2];
        var talukawise = await result.recordsets[3];
        var villagewise = await result.recordsets[4];

        // await talukawise.forEach(async (talukaele) => {
        //     talukaele.VillageData = await villagewise.filter(e => e.TalukaID == talukaele.TalukaID)
        // });

        // await districtwise.forEach(async (distele) => {
        //     distele.TalukaData = await talukawise.filter(e => e.DistrictID == distele.DistrictID)
        // })

        await statewise.forEach(async (stateele) => {
            stateele.DistrictData = await districtwise.filter(e => e.StateID == stateele.StateID)
        })

        return res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: {
                countryWise_Total_NoOfTax: countryWise[0] ? countryWise[0].NoOfTax : null,
                countryWise_Total_TotalAmount: countryWise[0] ? countryWise[0].TotalAmount : null,
                stateData: statewise
            }, message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during counting - Property Tax by Village, Taluka, District, state`;
        APIErrorLog(sp_GET_Property_Tax_Count_VTDS, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

var PostpropertyTaxViewByUser = async (req, res) => {

    try {

        var { DistrictID, UserID, AfterDays } = await { ...req.params };
        var { PageSize, PageNo = 1, Ascending, SortBy, FilterArray } = await { ...req.body }

        AfterDays = +AfterDays;
        UserID = +UserID;
        DistrictID = +DistrictID;

        if (!AfterDays || !UserID || !DistrictID || AfterDays < 1 || UserID < 1 || DistrictID < 1) {
            var errMessage = `please pass numeric values for AfterDays, UserID, DistrictID value!!!`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        if (!FilterArray) FilterArray = [];

        const todaydate = await CurrentDateTime();
        var FilterDate = moment(todaydate, "YYYY-MM-DD HH:mm").add(AfterDays, 'days').format('YYYY-MM-DD HH:mm');


        await FilterArray.push({
            "field": "DistrictID",
            "operator": "eq",
            "value": DistrictID
        }, {
            "field": "DueDate",
            "operator": "lte",
            "value": FilterDate
        })

        if (!SortBy) SortBy = 'PropertyTaxID';

        var option = { PageSize, PageNo, Ascending, SortBy, UserID };

        var Result = await Paginning_Serch_Sorting(sp_GET_Property_Tax_List_By_UserID, option, FilterArray);

        var output = await Result.output;
        var Details = await Result.recordset;

        return res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: {
                ...output,
                Records: Details.map(function (currentValue, Index) {
                    currentValue.SERIAL_NO = Index + 1 + (!PageSize ? 0 : (PageSize * (PageNo - 1)))
                    return currentValue
                })
            }, message: "Data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during View Propery Tax by User.`;
        APIErrorLog(sp_GET_Property_Tax_List_By_UserID, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

var GETpropertyPendingTaxByPropertyID = async (req, res) => {

    var { PropertyID } = await { ...req.params };
    PropertyID = +PropertyID;

    if (!PropertyID || PropertyID < 1) {
        var errMessage = `please pass numeric values for PropertyID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Select * From ${ViewTax} Where ReceiptID IS NULL AND PropertyID = ? order by PropertyTaxID DESC`, [PropertyID]);

    try {

        const data = await executeQuery(MsSqlQuery);
        const MasterDate = await data.recordset;

        res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: MasterDate.map(function (currentValue, Index) {
                currentValue.SERIAL_NO = Index + 1
                return currentValue
            }), message: "Tax List successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching Property Tax List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }

}


router.get('/api/property/tax/Count/User/:UserID/:AfterDays', GETpropertyTaxCountByUser);
router.post('/api/property/tax/View/:DistrictID/User/:UserID/:AfterDays', PostpropertyTaxViewByUser);

router.get('/api/property/pending/tax/View/:PropertyID', GETpropertyPendingTaxByPropertyID);

module.exports = router;