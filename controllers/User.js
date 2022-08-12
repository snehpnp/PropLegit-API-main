var router = require('express').Router();
var SqlString = require('sqlstring');

const { executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var viewUserMaster = 'view_UserMaster';

var GETUserList = async (req, res) => {


    var MsSqlQuery = await SqlString.format(`Select * from ${viewUserMaster} WHERE 1=1 `)

    try {

        var { UserID } = await { ...req.params }

        if (UserID) {
            MsSqlQuery += SqlString.format(` AND UserID = ?`, [UserID])
        }

        var data = await executeQuery(MsSqlQuery);
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));


    } catch (err) {
        var errMessage = `An error occurred during Fetching User List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }

}

router.get('/api/user/list', GETUserList);
router.get('/api/user/list/:UserID', GETUserList);

module.exports = router;