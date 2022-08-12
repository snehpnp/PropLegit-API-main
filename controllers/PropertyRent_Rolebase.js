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

var sp_GET_Property_Rent_Count_VTDS = `sp_GET_Property_Rent_Count_VTDS`;
var sp_GET_Property_Rent_List_By_UserID = `sp_GET_Property_Rent_List_By_UserID`;

const vw_AllRent_With_Tenant = 'vw_PropertyAllRent_With_Tenant';


var GETpropertyRentCountByUser = async (req, res) => {

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

        var result = await runStoredProcedure(sp_GET_Property_Rent_Count_VTDS, inputparams);
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
                countryWise: countryWise,
                stateData: statewise
            }, message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during counting - Property Rent by Village, Taluka, District, state`;
        APIErrorLog(sp_GET_Property_Rent_Count_VTDS, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var PostpropertyRentReceivableViewByUser = (req, res) => {
    PostpropertyRentViewByUser(req, res, 'Receivable')
}

var PostpropertyRentPayableViewByUser = (req, res) => {
    PostpropertyRentViewByUser(req, res, 'Payable')
}

var PostpropertyRentViewByUser = async (req, res, RentType) => {

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
            "field": "RentDueDate",
            "operator": "lte",
            "value": FilterDate
        }, {
            "field": "RentType",
            "operator": "eq",
            "value": RentType
        })

        if (!SortBy) SortBy = 'PropertyRentID';

        var option = { PageSize, PageNo, Ascending, SortBy, UserID };

        var Result = await Paginning_Serch_Sorting(sp_GET_Property_Rent_List_By_UserID, option, FilterArray);

        var output = await Result.output;
        var Details = await Result.recordset;
        var Propertyowners = await Result.recordsets[1];

        var Records = [];

        if (Details.length < 1) {
            return res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: {
                    ...output,
                    Records: Details

                }, message: "Data successfully Fetched"
            }, new ResponseModel()));
        }

        await Details.forEach(d => {

            d.PropertyOwner = Propertyowners.filter(p => p.PropertyID == d.PropertyID);
            Records.push(d);

            if (Details.length == Records.length) {
                return res.status(200).send(new modelBuilder().buildModel({
                    status: 200, data: {
                        ...output,
                        Records: Records.map(function (currentValue, Index) {
                            currentValue.SERIAL_NO = Index + 1 + (!PageSize ? 0 : (PageSize * (PageNo - 1)))
                            return currentValue
                        })

                    }, message: "Data successfully Fetched"
                }, new ResponseModel()));
            }

        })

    } catch (err) {
        var errMessage = `An error occurred during View Propery Rent by User.`;
        APIErrorLog(sp_GET_Property_Rent_List_By_UserID, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

const GETpropertyPendingRentByPropertyID = (req, res) => {

    var MsSqlQuery = SqlString.format(`Select * from ${vw_AllRent_With_Tenant}
    where PropertyID = ? AND RentType = 'Payable' AND DueAmount > 0
    order by PropertyTenantID desc;
    Select * from ${vw_AllRent_With_Tenant}
    where PropertyID = ? AND RentType = 'Receivable' AND DueAmount > 0
    order by PropertyTenantID desc`, [req.params.PropertyID, req.params.PropertyID])

    executeQuery(MsSqlQuery)
        .then(gettenant => {
            res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: {
                    'PayableTenant': gettenant.recordsets[0].map(function (currentValue, Index) {
                        currentValue.SERIAL_NO = Index + 1
                        return currentValue
                    }),
                    'ReceivableTenant': gettenant.recordsets[1].map(function (currentValue, Index) {
                        currentValue.SERIAL_NO = Index + 1
                        return currentValue
                    })
                }, message: "Rent Data Successfully Uploaded"
            }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Property Rent List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

router.get('/api/property/Rent/Count/User/:UserID/:AfterDays', GETpropertyRentCountByUser);

router.post('/api/property/Rent/Receivable/:DistrictID/User/:UserID/:AfterDays', PostpropertyRentReceivableViewByUser);
router.post('/api/property/Rent/Payable/:DistrictID/User/:UserID/:AfterDays', PostpropertyRentPayableViewByUser);

router.get('/api/property/pending/rent/View/:PropertyID', GETpropertyPendingRentByPropertyID);

module.exports = router;