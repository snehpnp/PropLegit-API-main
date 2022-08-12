var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');
var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var PropertyLegalCaseActsModel = require('../Model/PropertyLegalCaseActsModel')
const { executeQuery, runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var TableName = 'tbl_PropertyLegalcaseActs';
var spName = 'sp_POST_PropertyLegalCaseActs';

var GETPropertyLegalCaseActs = (req, res) => {

    var MsSqlQuery = SqlString.format(`Select * from ${TableName} where 1=1 `);

    if (req.params.LegalCaseID) {
        MsSqlQuery += SqlString.format(' AND LegalCaseID = ?', [req.params.LegalCaseID])
    }

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Property Legal case Acts`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}
var POSTPropertyLegalCaseActs = (req, res) => {

    var model = new modelBuilder().buildModel(req.body, new PropertyLegalCaseActsModel());

    model.LegalCaseID = req.params.LegalCaseID;
    var inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    runStoredProcedure(spName, inputparams)
        .then(result => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "Legal Case Acts successfully Inserted" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Adding Property Legal Case Acts data`;
            APIErrorLog(spName, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

router.get('/api/property/case/:LegalCaseID/acts', GETPropertyLegalCaseActs);
router.post('/api/property/case/:LegalCaseID/CaseActs', POSTPropertyLegalCaseActs);

module.exports = router;
