var router = require('express').Router();
const sql = require('mssql');

const { runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var spNameTaxType = `sp_GET_PropertyTaxType`

var GETPropertyTaxType = async (req, res) => {

    var { PropertyTypeID } = await { ...req.params };

    var inputparams = [];

    await inputparams.push({
        "name": 'PropertyTypeID',
        "type": sql.BigInt,
        "value": PropertyTypeID
    })

    try {

        const resultTaxType = await runStoredProcedure(spNameTaxType, inputparams);
        const MasterData = await resultTaxType.recordset;

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: MasterData, message: "Data successfully fetched" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during List Property Tax Type`;
        APIErrorLog(spNameTaxType, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

router.get('/api/Property/Tax/List/:PropertyTypeID', GETPropertyTaxType)

module.exports = router;