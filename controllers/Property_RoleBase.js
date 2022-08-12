var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');
const Paginning_Serch_Sorting = require('../shared/Paginning_Serch_Sorting');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var sp_GET_Property_Count_VTDS = `sp_GET_Property_Count_VTDS`;
var sp_GET_Property_List_By_UserID = `sp_GET_Property_List_By_UserID`;

var GETpropertyCountByUser = async (req, res) => {

    var { UserID } = { ...req.params };
    var { StateID } = { ...req.query };
    UserID = +UserID;
    StateID = +StateID;

    if (StateID == 0) StateID = null;

    if (!UserID || UserID < 1) {
        var errMessage = `please pass numeric values for UserID or StateID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var inputparams = [];

    inputparams.push({
        "name": 'UserID',
        "type": sql.BigInt,
        "value": UserID
    }, {
        "name": 'StateID',
        "type": sql.BigInt,
        "value": StateID
    })

    try {

        var result = await runStoredProcedure(sp_GET_Property_Count_VTDS, inputparams);
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
                countryWise: countryWise[0] ? countryWise[0].Count : null,
                stateData: statewise
            }, message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during counting - Property by Village, Taluka, District, state`;
        APIErrorLog(sp_GET_Property_Count_VTDS, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var PostpropertyViewByUser = async (req, res) => {

    try {

        var { DistrictID, UserID } = await { ...req.params };
        var { PageSize, PageNo = 1, Ascending, SortBy, FilterArray } = await { ...req.body }

        UserID = +UserID;
        DistrictID = +DistrictID;

        if (!UserID || !DistrictID || UserID < 1 || DistrictID < 1) {
            var errMessage = `please pass numeric values for UserID, DistrictID value!!!`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        if (!FilterArray) FilterArray = [];

        await FilterArray.push({
            "field": "DistrictID",
            "operator": "eq",
            "value": DistrictID
        })

        if (!SortBy) SortBy = 'PropertyID';

        var option = { PageSize, PageNo, Ascending, SortBy, UserID };

        var Result = await Paginning_Serch_Sorting(sp_GET_Property_List_By_UserID, option, FilterArray);

        var output = await Result.output;
        var Details = await Result.recordsets;
        var propertyDetails = Details[0];
        var PropertyOwnerShip = Details[1];
        var PropertyInCharge = Details[2];

        await propertyDetails.forEach(element => {
            element.PropertyOwnerShips = PropertyOwnerShip.filter(e => e.PropertyID === element.PropertyID);
            element.PropertyInCharges = PropertyInCharge.filter(e => e.PropertyID === element.PropertyID);
        })

        return res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: {
                ...output,
                Records: propertyDetails.map(function (currentValue, Index) {
                    currentValue.SERIAL_NO = Index + 1 + (!PageSize ? 0 : (PageSize * (PageNo - 1)))
                    return currentValue
                })

            }, message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during View Propery by User.`;
        APIErrorLog(sp_GET_Property_List_By_UserID, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.get('/api/property/Count/User/:UserID', GETpropertyCountByUser);
router.post('/api/property/View/:DistrictID/User/:UserID', PostpropertyViewByUser);

module.exports = router;