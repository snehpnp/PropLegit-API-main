var router = require('express').Router();
var SqlString = require('sqlstring');


const { executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var tblBank = `tbl_BankMaster`;

var GETBankList = (req, res) => {

    var MsSqlQuery = SqlString.format(`SELECT * from ${tblBank} where ISActive = 1;`)

    executeQuery(MsSqlQuery)
        .then(BankResult => {
            res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: BankResult.recordset, message: "Bank List Successfully Fetched"
            }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during fetching Bank List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

router.get('/api/loan/bank/list', GETBankList);

module.exports = router;