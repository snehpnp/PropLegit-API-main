var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');
const Paginning_Serch_Sorting = require('../shared/Paginning_Serch_Sorting');
const CurrentDateTime = require('../shared/CurrentDateTime');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var sp_GET_Property_LegalCase_Count_VTDS = `sp_GET_Property_LegalCase_Count_VTDS`;
var sp_GET_Property_LegalCase_List_By_UserID = `sp_GET_Property_LegalCase_List_By_UserID`;
const Property_ongoing_LegalCase_List = 'sp_GET_Property_ongoing_LegalCase_List'

var GETpropertylegalcaseOngoingCountByUser = (req, res) => {
    GETpropertylegalcaseCountByUser(req, res, 'Ongoing')
}

var GETpropertylegalcaseDisposedCountByUser = (req, res) => {
    GETpropertylegalcaseCountByUser(req, res, 'Disposed')

}

var GETpropertylegalcaseCountByUser = async (req, res, Status) => {

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
        "name": 'CurrentDateTime',
        "type": sql.VarChar(100),
        "value": CurrentDateTime()
    }, {
        "name": 'Status',
        "type": sql.VarChar(100),
        "value": Status
    }, {
        "name": 'StateID',
        "type": sql.BigInt,
        "value": StateID
    })

    try {

        var result = await runStoredProcedure(sp_GET_Property_LegalCase_Count_VTDS, inputparams);
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
                countryWise_Total_NoOfCase: countryWise[0] ? countryWise[0].NoOfCase : null,
                stateData: statewise
            }, message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during counting - Property legalcase by Village, Taluka, District, state`;
        APIErrorLog(sp_GET_Property_LegalCase_Count_VTDS, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var PostpropertylegalcaseOngoingViewByUser = (req, res) => {
    PostpropertylegalcaseViewByUser(req, res, 'Ongoing')
}

var PostpropertylegalcaseDisposedViewByUser = (req, res) => {
    PostpropertylegalcaseViewByUser(req, res, 'Disposed')
}

var PostpropertylegalcaseViewByUser = async (req, res, Status) => {

    if (Status == 'Ongoing') Status = 1
    if (Status == 'Disposed') Status = 2

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
        }, {
            "field": "Status",
            "operator": "eq",
            "value": Status
        })

        if (!SortBy) SortBy = 'LegalCaseID';

        var option = { PageSize, PageNo, Ascending, SortBy, UserID };

        var Result = await Paginning_Serch_Sorting(sp_GET_Property_LegalCase_List_By_UserID, option, FilterArray);

        var output = await Result.output;
        var Details = await Result.recordset;
        // const petitionerLawyerinfo = await Result.recordsets[1];
        // const respondentLawyerinfo = await Result.recordsets[2];
        const petitionersinfo = await Result.recordsets[1];
        const respondentsinfo = await Result.recordsets[2];
        // const petitionersinfo = await Result.recordsets[3];
        // const respondentsinfo = await Result.recordsets[4];
        var Records = [];

        await new Promise((resolve) => {

            if (Details.length == 0) resolve(Records);

            Details.forEach(async (ecase) => {

                // const petitionerLawyerinfos = await petitionerLawyerinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                // ecase.petitionerLawyerinfo = await petitionerLawyerinfos[0] ? petitionerLawyerinfos[0] : null;

                // const respondentLawyerinfos = await respondentLawyerinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                // ecase.respondentLawyerinfo = await respondentLawyerinfos[0] ? respondentLawyerinfos[0] : null

                ecase.petitionerLawyerinfo = await petitionersinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                ecase.respondentLawyerinfo = await respondentsinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                Records.push(ecase);

                if (Records.length === Details.length) {
                    resolve(Records.map(function (currentValue, Index) {
                        currentValue.SERIAL_NO = Index + 1 + (!PageSize ? 0 : (PageSize * (PageNo - 1)))
                        return currentValue
                    }))
                }
            })
        })

        return res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: {
                ...output,
                Records

            }, message: "Data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during View Propery legalcase by User.`;
        APIErrorLog(sp_GET_Property_LegalCase_List_By_UserID, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

const GETOngoinglegalcaseByPropertyID = async (req, res) => {

    var { PropertyID } = await { ...req.params };
    PropertyID = +PropertyID;

    if (!PropertyID || PropertyID < 1) {
        var errMessage = `please pass numeric values for PropertyID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var inputparams = [];

    inputparams.push({
        "name": 'PropertyID',
        "type": sql.BigInt,
        "value": PropertyID
    })

    try {

        const Result = await runStoredProcedure(Property_ongoing_LegalCase_List, inputparams);
        var Details = await Result.recordset;
        // const petitionerLawyerinfo = await Result.recordsets[1];
        // const respondentLawyerinfo = await Result.recordsets[2];
        const petitionersinfo = await Result.recordsets[1];
        const respondentsinfo = await Result.recordsets[2];
        // const petitionersinfo = await Result.recordsets[3];
        // const respondentsinfo = await Result.recordsets[4];

        var Records = [];

        await new Promise((resolve) => {

            if (Details.length == 0) resolve(Records);

            Details.forEach(async (ecase) => {

                // const petitionerLawyerinfos = await petitionerLawyerinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                // ecase.petitionerLawyerinfo = await petitionerLawyerinfos[0] ? petitionerLawyerinfos[0] : null;

                // const respondentLawyerinfos = await respondentLawyerinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                // ecase.respondentLawyerinfo = await respondentLawyerinfos[0] ? respondentLawyerinfos[0] : null

                ecase.petitionerLawyerinfos = await petitionersinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                ecase.respondentLawyerinfo = await respondentsinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                Records.push(ecase);

                if (Records.length === Details.length) {
                    resolve(Records.map(function (currentValue, Index) {
                        currentValue.SERIAL_NO = Index + 1
                        return currentValue
                    }))
                }
            })
        })

        return res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: Records, message: "Data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching Property Legal case List`;
        APIErrorLog(Property_LegalCase_List, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

router.get('/api/property/legalcase/Ongoing/Count/User/:UserID', GETpropertylegalcaseOngoingCountByUser);
router.get('/api/property/legalcase/Disposed/Count/User/:UserID', GETpropertylegalcaseDisposedCountByUser);

router.post('/api/property/legalcase/Ongoing/:DistrictID/User/:UserID', PostpropertylegalcaseOngoingViewByUser);
router.post('/api/property/legalcase/Disposed/:DistrictID/User/:UserID', PostpropertylegalcaseDisposedViewByUser);

router.get('/api/property/legalcase/Ongoing/:PropertyID', GETOngoinglegalcaseByPropertyID);

module.exports = router;