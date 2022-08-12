var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var GETLoanPVRDetailsRead = async (req, res) => {

    const { AppID } = await { ...req.params };

    if (!+AppID || +AppID < 1) {
        var errMessage = `please pass numeric values for AppIDvalue!!!`;
        return res.status(200).send({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage });
    }

    var MsSqlQuery = SqlString.format(`Select Top 1 * from tbl_aiIPVR Where Application_id = ? order by aipvr_id desc`, [AppID]);

    try {
        const data = await executeQuery(MsSqlQuery);

        res.status(200).send({
            status: 200, data: data.recordset, message: "data successfully Fetched"
        });
    } catch (err) {
        var errMessage = `An error occurred during iPVR details read`;
         APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send({ status: 500, error_code: 'SERVER_ERROR', error: errMessage });
    }
}

router.get('/api/loan/pvr/details/extract/:AppID', GETLoanPVRDetailsRead);

module.exports = router;