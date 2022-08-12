var router = require('express').Router();
var SqlString = require('sqlstring');

const { executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');



var GETUserStatepermission = async (req, res) => {

    const { UserID } = { ...req.params };

    if (+UserID < 1 || !+UserID) {
        var errMessage = `please pass numeric values for User ID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }


    var MsSqlQuery = await SqlString.format(`Select us.*, s.StateName from tblUserState us
    left join tblState s
    on s.StateID = us.StateID
    Where UserID = ?`, [UserID])

    try {

        var data = await executeQuery(MsSqlQuery);
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "User State Wise Permission Data Fetched" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching User State wise Permission List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }

}

router.get('/api/user/State/permission/:UserID', GETUserStatepermission);

module.exports = router;