var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery, runStoredProcedure, UpdateQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var TableName = 'tbl_DropdownMaster'
var TableSubName = 'tbl_DropdownItem'

var GETDocumentType = (req, res) => {
    var MsSqlQuery = SqlString.format(`Select DropDownItemID, DropDownValue from ${TableSubName} where DropDownID = ${req.params.DropDownID}`);

    if (req.params.DropDownItemID) {
        MsSqlQuery += SqlString.format(' AND DropDownItemID = ?', [req.params.DropDownItemID])
    }

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Document Type List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var GETDocumentSubType = (req, res) => {

    var MsSqlQuery = SqlString.format(`Select DropDownItemID, DropDownValue from ${TableSubName} where DropDownID = (Select DropDownID from ${TableName} where DropDownName = (Select DropDownValue from ${TableSubName} where DropDownItemID = ?))`, [req.params.DropDownItemID]);

    // if (req.params.DropDownItemID) {
    //     MsSqlQuery += SqlString.format(' AND DropDownItemID = ?', [req.params.DropDownItemID])
    // }

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Document Sub Type List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

var GETFileType = (req, res) => {
    var MsSqlQuery = SqlString.format(`Select DropDownItemID, DropDownValue from ${TableSubName} where DropDownID = 3 `);

    if (req.params.DropDownItemID) {
        MsSqlQuery += SqlString.format(' AND DropDownItemID = ?', [req.params.DropDownItemID])
    }

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Document Type List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}



router.get('/api/property/DocumentType/:DropDownID', GETDocumentType)
    // router.get('/api/property/DocumentType/:DropDownID/:DropDownItemID', GETDocumentType)

// router.get('/api/property/DocumentSubType/:DropDownItemID', GETDocumentSubType)

// router.get('/api/property/FileType', GETFileType)
// router.get('/api/property/FileType/:DropDownItemID', GETFileType)

module.exports = router;