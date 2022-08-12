var router = require('express').Router();
var SqlString = require('sqlstring');

const { executeQuery} = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var TableName = 'tblPropertyType';

var GETPropertyType = (req, res) => {

    var MsSqlQuery = SqlString.format(`SELECT * from ${TableName} WHERE 1 = 1`);

    if(req.query.IsOpenLand){
        MsSqlQuery += SqlString.format(` AND IsOpenLand =?`, [req.query.IsOpenLand])
    }

    if(req.params.PropertyTypeID){
        MsSqlQuery += SqlString.format(` AND PropertyTypeID =?`, [req.params.PropertyTypeID])
    }

    executeQuery(MsSqlQuery)
    .then(data => {
        res.status(200).send(new modelBuilder().buildModel({ status : 200, data:data.recordset, message : "data successfully Fetched"}, new ResponseModel()));
    })
    .catch(err => {
        var errMessage = `An error occurred during Fetching Property type List`;;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status : 500, error_code:'SERVER_ERROR', error : errMessage }, new ResponseModel()));
    })

}

router.get('/api/propertytype/list', GETPropertyType);
router.get('/api/propertytype/list/:PropertyTypeID', GETPropertyType);
module.exports = router;