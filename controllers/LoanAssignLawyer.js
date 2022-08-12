var router = require('express').Router();
var SqlString = require('sqlstring');

const { executeQuery, runStoredProcedure, UpdateQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

const tblApplication = 'tbl_Application';

var PUTAssignLawyer = (req, res) => {

    var AppID = req.params.AppID;
    var LawyerID = req.params.LawyerID;

    var MsSqlQuery = SqlString.format(`UPDATE ${tblApplication} SET ApplicationStatus = 'Title Search Pending', LawyerID = ? WHERE AppID = ?`, [LawyerID, AppID]);

    executeQuery(MsSqlQuery)
        .then(data => {
            if (data.rowsAffected == 1) {
                res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.rowsAffected, message: "Lawyer Assign Sccessfully!!" }, new ResponseModel()));
            } else {
                res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: 'Not_Found', message: "Records Not found" }, new ResponseModel()));
            }
        })
        .catch(err => {
            var errMessage = `An error occurred during Assign Lawyer!!`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

router.put('/api/loan/assign/lawyer/:AppID/:LawyerID', PUTAssignLawyer);

module.exports = router;