var router = require('express').Router();
var SqlString = require('sqlstring');

const { executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var TableName = 'tblState';

var GETStateList = (req, res) => {
    var MsSqlQuery = SqlString.format(`Select * from ${TableName} where 1=1 `);

    if (req.params.StateID) {
        MsSqlQuery += SqlString.format(' AND StateID = ?', [req.params.StateID])
    }
    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching State List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var GETStateListWithALLIndia = async (req, res) => {
    var MsSqlQuery = await SqlString.format(`Select * from ${TableName} where 1=1 `);

    try {

        const data = await executeQuery(MsSqlQuery);

        var StateList = await [{
            "StateID": 0,
            "StateName": "All India",
            "StateShortCode": null,
            "IsVerified": false
        }]

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: StateList.concat(data.recordset), message: "data successfully Fetched" }, new ResponseModel()));


    } catch (err) {
        var errMessage = `An error occurred during Fetching State List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.get('/api/state/list/:StateID', GETStateList);
router.get('/api/state/list', GETStateList);
router.get('/api/country/state/list', GETStateListWithALLIndia);

module.exports = router;