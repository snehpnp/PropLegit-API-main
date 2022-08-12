var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var TableName = `tblMappingIPVRAuto`;


var GETMAPPINGAIIPVR = (req, res) => {

    var { StateID } = { ...req.params }
    var MsSqlQuery = SqlString.format(`select * from ${TableName} where StateID = ?`, [StateID]);

    executeQuery(MsSqlQuery)
        .then(result => {
        
            res.status(200).send({ status: 200, message: "Getting mapping data successfully ",data: result.recordset, });
        }).catch(err => {
    
            var errMessage = `An error occurred during getting mapping data`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send({ status: 500, error_code: 'SERVER_ERROR', error: errMessage });
        })
}

router.get('/api/getdropdownstate/:StateID', GETMAPPINGAIIPVR);

module.exports = router;



