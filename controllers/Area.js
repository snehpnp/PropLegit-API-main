var router = require('express').Router();
var SqlString = require('sqlstring');

const { executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var ViewName = 'view_Area'

var GETAreaList = (req, res) => {
    MsSqlQuery = SqlString.format(`SELECT Area,VillageId,VillageName,TalukaId,TalukaName,DistrictId,DistrictName,PinCode, stateID
        FROM ${ViewName} WHERE (Area like ? OR PinCode like ?)`, [req.params.search + '%', req.params.search + '%']);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Area List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var GETAreaByVillageID = (req, res) => {
    MsSqlQuery = SqlString.format(`SELECT Area,VillageId,VillageName,TalukaId,TalukaName,DistrictId,DistrictName,PinCode, stateID
        FROM ${ViewName} WHERE VillageId=?`, [req.params.VillageId]);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Area List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var GETDistrictList = async (req, res) => {

    var { StateID } = await { ...req.params };

    var MsSqlQuery = await SqlString.format(`SELECT DistrictID, UPPER(LEFT(DistrictName,1))+LOWER(SUBSTRING(DistrictName,2,LEN(DistrictName))) as DistrictName, IsVerified, stateID FROM tblDistrict WHERE 1=1 `);

    if (StateID) {
        MsSqlQuery += await SqlString.format(`  AND StateID= ? `, [StateID]);
    }

    MsSqlQuery += await SqlString.format(`  order by DistrictName asc`);

    try {
        var data = await executeQuery(MsSqlQuery)
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
    } catch (err) {
        var errMessage = `An error occurred during Fetching District List By StateID`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var GETTalukaList = (req, res) => {
    MsSqlQuery = SqlString.format(`SELECT * FROM tblTaluka WHERE DistrictID=?`, [req.params.DistrictID]);
    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Area List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}


var GETVillageList = (req, res) => {
    MsSqlQuery = SqlString.format(`SELECT * FROM tblVillage WHERE TalukaID=?`, [req.params.TalukaID]);
    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Area List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var GETAreaListByStateId = (req, res) => {
    MsSqlQuery = SqlString.format(`SELECT Area,VillageId,VillageName,TalukaId,TalukaName,DistrictId,DistrictName,PinCode, stateID
    FROM ${ViewName} WHERE
    (Area like ? OR PinCode Like ?)
    and StateId=? `, [req.params.Search + '%', '%' + req.params.Search + '%', req.params.StateId]);

    if (req.query.DistrictId) {
        MsSqlQuery += SqlString.format(` and DistrictId = ?`, [req.query.DistrictId])
    }

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Area List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var GETAreaListBystateID = async (req, res) => {

    var MsSqlQuery = await SqlString.format(`Select v.VillageID, v.VillageName, t.TalukaID, t.TalukaName, d.DistrictID, d.stateID,
        d.DistrictName, s.StateName
        from tblVillage v
        left join tblTaluka t on t.TalukaID = v.TalukaID
        left join tblDistrict d on d.DistrictID = t.DistrictID
        left join tblState s on s.StateID = d.StateID
        where d.stateID =  ? `, [req.params.stateID]);

    try {

        var data = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching Area List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.get('/api/area/list/:search', GETAreaList);
router.get('/api/area/view/:VillageId', GETAreaByVillageID);

router.get('/api/area/list/state/:StateId/district/area/:Search', GETAreaListByStateId);
router.get('/api/area/list/Distict/:stateID', GETAreaListBystateID);

router.get('/api/district/list/:StateID', GETDistrictList);
router.get('/api/district/list', GETDistrictList);

router.get('/api/taluka/list/:DistrictID', GETTalukaList);
router.get('/api/village/list/:TalukaID', GETVillageList);

module.exports = router;



