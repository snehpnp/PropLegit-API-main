var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');
const { executeQuery, runStoredProcedure, UpdateQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var LawyerModel= require('../Model/LawyerModel')

var CurrentDateTime = require('../shared/CurrentDateTime');

var TableName = 'tblLawyer';
var spName = 'sp_POST_Lawyer';

var GETLawyer = (req, res) => {

    var MsSqlQuery = SqlString.format(`SELECT  * FROM  ${TableName} where isActive='1'`);

    if(req.params.LawyerId){
      MsSqlQuery += SqlString.format(' and LawyerId =?', [req.params.LawyerId])
    }
   
    executeQuery(MsSqlQuery)
    .then(data => {
        res.status(200).send(new modelBuilder().buildModel({ status : 200, data:data.recordset, message : "Data Successfully Fetched"}, new ResponseModel()));
    })
    .catch(err => {
        var errMessage = `An error occurred during Fetching Lawyer List`;;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status : 500, error_code:'SERVER_ERROR', error : errMessage }, new ResponseModel()));
    })
}

var POSTLawyer=(req,res) => {

    var model = new modelBuilder().buildModel(req.body, new LawyerModel());

    model.RecordDate = CurrentDateTime();
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
        res.status(200).send(new modelBuilder().buildModel({ status : 200, data:result.recordset, message : "data successfully Inserted"}, new ResponseModel()));
    })
    .catch(err => {
        var errMessage = `An error occurred during Adding Property Rent data`;
        APIErrorLog(spName, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status : 500, error_code:'SERVER_ERROR', error : errMessage }, new ResponseModel()));
    })
}

var PUTLawyer = (req, res) => {
    
    var model = new modelBuilder().buildModel(req.body, new LawyerModel());

    model.UpdatedDate = CurrentDateTime();
  
    UpdateQuery(TableName, model, req.params.LawyerId, 'LawyerId')
    .then(MsSqlQuery => {
       
        executeQuery(MsSqlQuery)
        .then(data => {
            if(data.rowsAffected == 1){
                res.status(200).send(new modelBuilder().buildModel({ status : 200, data:data.rowsAffected, message : "Records successfully Updated"}, new ResponseModel()));
            }else{
                res.status(200).send(new modelBuilder().buildModel({ status : 404, error_code:'Not_Found',  message : "Records Not found"}, new ResponseModel()));
            }

        })
        .catch(err => {
           
            var errMessage = `An error occurred during Updating Property Rent Data`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status : 500, error_code:'SERVER_ERROR', error : errMessage }, new ResponseModel()));
        })

    })
    .catch(err => {
        var errMessage = err;
        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(200).send(new modelBuilder().buildModel({ status : 404, error_code:'NO_CONTENT', error : errMessage }, new ResponseModel()));
    })
}
var DELETELawyer = (req, res) => {

    var MsSqlQuery = SqlString.format(`Update ${TableName} set isActive=0 where LawyerId = ?`, [req.params.LawyerId]);

    executeQuery(MsSqlQuery)
    .then(data => {
        if(data.rowsAffected == 1){
            res.status(200).send(new modelBuilder().buildModel({ status : 200, data:data.rowsAffected, message : "Records successfully Deleted"}, new ResponseModel()));
        }else{
            res.status(200).send(new modelBuilder().buildModel({ status : 404, error_code:'Not_Found', message : "Records Not found"}, new ResponseModel()));
        }
    })
    .catch(err => {
        var errMessage = err;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status : 500, error_code:'Not_Found', error : errMessage }, new ResponseModel()));
    })
}

router.post('/api/Lawyer/add', POSTLawyer);
router.get('/api/Lawyer/list', GETLawyer);
router.get('/api/Lawyer/view/:LawyerId', GETLawyer);
router.delete('/api/Lawyer/delete/:LawyerId', DELETELawyer)
router.put('/api/Lawyer/update/:LawyerId',PUTLawyer);

module.exports = router;

