var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery, runStoredProcedure, UpdateQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var PropertyLegalCaseModel = require('../Model/PropertyLegalCaseModel')

var CurrentDateTime = require('../shared/CurrentDateTime');

var TableName = 'tbl_PropertyLegalcase';
var spName = 'sp_POST_PropertyLegalcase';
const Property_LegalCase_List = 'sp_GET_Property_LegalCase_List'

var GETPropertyLegalCaseTypes = (req, res) => {
    var MsSqlQuery = SqlString.format(`Select * From tbl_PropertyLegalCaseTypes`)
    executeQuery(MsSqlQuery).then(data => {
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
    }).catch(err => {
        var errMessage = `An error occurred during Fetching Property Legal case List`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    })
}

var GETPropertyLegalCase = async (req, res) => {

    var { PropertyID, LegalCaseID } = await { ...req.params };
    PropertyID = +PropertyID;
    LegalCaseID = +LegalCaseID;

    if ((PropertyID && PropertyID < 1) || (LegalCaseID && LegalCaseID < 1)) {
        var errMessage = `please pass numeric values for PropertyID or LegalCaseID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var inputparams = [];

    inputparams.push({
        "name": 'PropertyID',
        "type": sql.BigInt,
        "value": PropertyID
    }, {
        "name": 'LegalCaseID',
        "type": sql.BigInt,
        "value": LegalCaseID
    })

    try {

        const Result = await runStoredProcedure(Property_LegalCase_List, inputparams);
        var Details = await Result.recordset;
        // const petitionerLawyerinfo = await Result.recordsets[1];
        // const respondentLawyerinfo = await Result.recordsets[2];
        const petitionersinfo = await Result.recordsets[1];
        const respondentsinfo = await Result.recordsets[2];
        // const petitionersinfo = await Result.recordsets[3];
        // const respondentsinfo = await Result.recordsets[4];
        var Records = [];

        await new Promise((resolve) => {

            if (Details.length == 0) resolve(Records);

            Details.forEach(async (ecase) => {

                // const petitionerLawyerinfos = await petitionerLawyerinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                // ecase.petitionerLawyerinfo = await petitionerLawyerinfos[0] ? petitionerLawyerinfos[0] : null;

                // const respondentLawyerinfos = await respondentLawyerinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                // ecase.respondentLawyerinfo = await respondentLawyerinfos[0] ? respondentLawyerinfos[0] : null

                ecase.petitionerLawyerinfos = await petitionersinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                ecase.respondentLawyerinfo = await respondentsinfo.filter(l => l.LegalCaseID == ecase.LegalCaseID);
                Records.push(ecase);

                if (Records.length === Details.length) resolve(Records)
            })
        })

        return res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: Records, message: "Data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching Property Legal case List`;
        APIErrorLog(Property_LegalCase_List, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

var GETPropertyLegalCaseDetails = (req, res) => {

    var MsSqlQuery = SqlString.format(`Select l.*, t.LegalCaseTypeName, d.FileURL from ${TableName} l
    LEFT JOIN tbl_PropertyLegalCaseTypes as t on t.LegalCaseTypeID = l.CaseType
    LEFT JOIN view_PropertyDocument as d on d.DocumentID = l.OrderDocumentID
    where l.LegalCaseID = ? ;
    select * from tbl_PropertyLegalCaseActs where LegalCaseID = ?`, [req.params.LegalCaseID, req.params.LegalCaseID]);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: { CaseDetails: data.recordset[0], Acts: data.recordsets[1] }, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Property Legal case List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var POSTPropertyLegalCase = async (req, res) => {

    try {

        var { PropertyID } = await { ...req.params };
        var { CreatedBy } = await { ...req.body };

        var model = new modelBuilder().buildModel(req.body, new PropertyLegalCaseModel());

        model.CreatedAt = CurrentDateTime();
        model.CreatedBy = CreatedBy;
        model.IpAddress = req.connection.remoteAddress;
        model.PropertyID = PropertyID;

        var inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        const result = await runStoredProcedure(spName, inputparams);

        const LegalCaseID = await result.recordset[0].LegalCaseID;

        res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: [{
                LegalCaseID
            }], message: "Legal Case Successfully Inserted"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Adding Property Legal Case data`;
        APIErrorLog(spName, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var PUTPropertyLegalCase = (req, res) => {

    var model = new modelBuilder().buildModel(req.body, new PropertyLegalCaseModel());

    model.ModifiedAt = CurrentDateTime();
    model.ModifiedBy = req.body.ModifiedBy;
    model.IpAddress = req.connection.remoteAddress;

    UpdateQuery(TableName, model, req.params.LegalCaseID, 'LegalCaseID')
        .then(MsSqlQuery => {

            executeQuery(MsSqlQuery)
                .then(data => {

                    if (data.rowsAffected == 1) {
                        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.rowsAffected, message: "Records successfully Updated" }, new ResponseModel()));
                    } else {
                        res.status(404).send(new modelBuilder().buildModel({ status: 404, error_code: 'Not_Found', message: "Records Not found" }, new ResponseModel()));
                    }

                })
                .catch(err => {
                    var errMessage = `An error occurred during Updating Property Legal Case Data`;
                    APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                })

        })
        .catch(err => {

            var errMessage = err;
            APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(404).send(new modelBuilder().buildModel({ status: 404, error_code: 'NO_CONTENT', error: errMessage }, new ResponseModel()));
        })

}

var DELETEPropertyLegalCase = (req, res) => {

    var MsSqlQuery = SqlString.format(`Delete from ${TableName} where LegalCaseID = ?`, [req.params.LegalCaseID]);

    executeQuery(MsSqlQuery)
        .then(data => {

            if (data.rowsAffected == 1) {
                res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.rowsAffected, message: "Records successfully Deleted" }, new ResponseModel()));
            } else {
                res.status(404).send(new modelBuilder().buildModel({ status: 404, error_code: 'Not_Found', message: "Records Not found" }, new ResponseModel()));
            }
        })
        .catch(err => {
            var errMessage = `An error occurred during Deleting Property Legal Case Data`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'Not_Found', error: errMessage }, new ResponseModel()));
        })

}

router.post('/api/property/:PropertyID/case/add', POSTPropertyLegalCase);
router.get('/api/property/legalcase/types/list', GETPropertyLegalCaseTypes);
router.get('/api/property/:PropertyID/case/list', GETPropertyLegalCase);
router.get('/api/property/:PropertyID/case/view/:LegalCaseID', GETPropertyLegalCase);
router.get('/api/property/case/details/:LegalCaseID', GETPropertyLegalCaseDetails);
router.put('/api/property/case/update/:LegalCaseID', PUTPropertyLegalCase)
router.delete('/api/property/case/delete/:LegalCaseID', DELETEPropertyLegalCase)

module.exports = router;