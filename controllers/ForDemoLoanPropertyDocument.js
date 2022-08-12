var router = require('express').Router();
const sql = require('mssql');

const { runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var spDemoLoadPropertyDoc = 'sp_Demo_AddPropertyDocument';

var GETDemoLoanPropertyDocumentUpload = (req, res) => {
    var model = {
        AppID: req.params.AppID
    }

    var inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    runStoredProcedure(spDemoLoadPropertyDoc, inputparams)
        .then(result => {

            res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: result.rowsAffected, message: "All Document Successfully Uploaded and reviewed!!"
            }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Change Property Document Status `;
            APIErrorLog(spDemoLoadPropertyDoc, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

router.get('/api/loan/Property/all/Document/Upload/:AppID', GETDemoLoanPropertyDocumentUpload);

module.exports = router;