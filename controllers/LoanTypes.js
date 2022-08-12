var router = require('express').Router();
var SqlString = require('sqlstring');

const { executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var viewDropDown = `vw_DropDownValue`;

var GETLoanApplicationTypes = (req, res) => {

    var MsSqlQuery = SqlString.format(`SELECT DropDownItemID, DropDownValue from ${viewDropDown} where DropDownID = 5`);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: data.recordset, message: "data successfully Fetched"
            }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Loan Types`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var GETLoanPropertyTypes = (req, res) => {

    var MsSqlQuery = SqlString.format(`SELECT DropDownItemID, DropDownValue from ${viewDropDown} where DropDownID = 6`);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: data.recordset, message: "data successfully Fetched"
            }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Loan Types`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}


router.get('/api/loan/application/types', GETLoanApplicationTypes);
router.get('/api/loan/Property/types', GETLoanPropertyTypes);

module.exports = router;