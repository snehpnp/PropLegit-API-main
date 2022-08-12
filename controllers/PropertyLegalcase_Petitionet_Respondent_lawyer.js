var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');
const { executeQuery, runStoredProcedure, UpdateQuery, runStoredProcedureTblinput } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var CurrentDateTime = require('../shared/CurrentDateTime');
const EmailLegalCase = require('../EmailTemplate/EmailLegalCase');
const SMSLegalCase = require('../SMSTemplate/SMSLegalCase.js')
const SendHearingEmail = require('../shared/SendHearingEmail');

var TableName2 = 'tbl_PropertyLegalCasePetitionerAndRespondent';
var spName2 = 'sp_POST_PropertyLegalCasePetitionerAndRespondent';

var POSTPropertyLegalcasePetitioner = async (req, res) => {
    var { Petitioner } = await { ...req.body };
    Add_Petitioner_Respondent_Lawyer(req, res, 'P', Petitioner)
}

var POSTPropertyLegalcaseRespondent = async (req, res) => {
    var { Respondent } = await { ...req.body };
    Add_Petitioner_Respondent_Lawyer(req, res, 'R', Respondent)
}

var Add_Petitioner_Respondent_Lawyer = async (req, res, Type, temp_P_and_R) => {

    var { LawyerID, CreatedBy } = await { ...req.body };
    var { LegalCaseID } = await { ...req.params };
    var DateTime = await CurrentDateTime();

    if (!temp_P_and_R) temp_P_and_R = [];

    var temp_Details = new sql.Table();

    // Columns must correspond with type we have created in database.  
    temp_Details.columns.add("LegalCaseID", sql.BigInt);
    temp_Details.columns.add("Name", sql.VarChar(255));
    temp_Details.columns.add("Email", sql.VarChar(50));
    temp_Details.columns.add("Mobile", sql.VarChar(15));
    temp_Details.columns.add("Type", sql.NChar(1));
    temp_Details.columns.add("CreatedAt", sql.VarChar(255));
    temp_Details.columns.add("CreatedBy", sql.BigInt);

    // Add data into the table that will be pass into the procedure  

    for (var i = 0; i < temp_P_and_R.length; i++) {
        temp_Details.rows.add(LegalCaseID, temp_P_and_R[i].Name, temp_P_and_R[i].Email, temp_P_and_R[i].Mobile, Type, DateTime, CreatedBy);
    }

    var inputparams = [];
    inputparams.push({
        name: 'temp_Details',
        value: temp_Details
    }, {
        name: 'LegalCaseID',
        value: LegalCaseID
    }, {
        name: 'Type',
        value: Type
        // }, {
        //     name: 'LawyerID',
        //     value: LawyerID
    }, {
        name: 'IpAddress',
        value: req.myCustomAttributeName
    }, {
        name: 'CreatedAt',
        value: DateTime
    }, {
        name: 'CreatedBy',
        value: CreatedBy
    })

    try {

        const result = await runStoredProcedureTblinput(spName2, inputparams);

        const recordsets = await result.recordsets

        if (recordsets.length > 0) {

            const caseInfo = recordsets[0];
            const senderInfo = recordsets[1];
            const emailTemplateInfo = recordsets[2];
            const SMSTemplateInfo = recordsets[3];

            const emailresult = EmailLegalCase(caseInfo[0], senderInfo, emailTemplateInfo[0]);
            const SMSresult = SMSLegalCase(caseInfo[0], senderInfo, SMSTemplateInfo[0]);
            const HearingEmail = SendHearingEmail(LegalCaseID);
        }


        res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: [], message: `Legal Case ${Type === 'R' ? 'Respondent' : 'Petitioner'}'s Advocate Succesfullly Added!`
        }, new ResponseModel()));


    } catch (err) {
        var errMessage = `An error occurred during Adding Property Legal Case Petitioner, Respondent, Lawyer info data`;
        APIErrorLog(spName2, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }

}

var GETPropertyLegalCasePetitioner = (req, res) => {

    // var MsSqlQuery = SqlString.format(`Select * from ${TableName2} where Type = 'P' AND LegalCaseID = ? ; 
    // Select * from tbl_PropertyLegalcaseLawyer lcl left join tblLawyer as l on lcl.LawyerID = l.LawyerId
    // where lcl.LawyerFor = 'P' AND lcl.LegalCaseID = ?`, [req.params.LegalCaseID, req.params.LegalCaseID]);

    var MsSqlQuery = SqlString.format(`Select * from ${TableName2} where Type = 'P' AND LegalCaseID = ? ;`, [req.params.LegalCaseID]);

    executeQuery(MsSqlQuery)
        .then(data => {
            var Res = {
                Petitioners: data.recordsets[0]
                // , Lawyer: {
                //     ...data.recordsets[1][0]
                // }
            }
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: Res, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Property Legal case List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var GETPropertyLegalCaseRespondent = (req, res) => {

    // var MsSqlQuery = SqlString.format(`Select * from ${TableName2} where Type = 'R' AND LegalCaseID = ? ; 
    // Select * from tbl_PropertyLegalcaseLawyer lcl left join tblLawyer as l on lcl.LawyerID = l.LawyerId
    // where lcl.LawyerFor = 'R' AND lcl.LegalCaseID = ?`, [req.params.LegalCaseID, req.params.LegalCaseID]);

    var MsSqlQuery = SqlString.format(`Select * from ${TableName2} where Type = 'R' AND LegalCaseID = ? ;`, [req.params.LegalCaseID]);

    executeQuery(MsSqlQuery)
        .then(data => {
            var Res = {
                Respondents: data.recordsets[0]
                // , Lawyer: { ...data.recordsets[1][0] }
            }
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: Res, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Property Legal case List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}


router.get('/api/property/case/:LegalCaseID/petitionersandlawyer', GETPropertyLegalCasePetitioner);
router.get('/api/property/case/:LegalCaseID/respondentsandlawyer', GETPropertyLegalCaseRespondent);

router.post('/api/property/case/:LegalCaseID/petitioner', POSTPropertyLegalcasePetitioner);
router.post('/api/property/case/:LegalCaseID/respondent', POSTPropertyLegalcaseRespondent);

module.exports = router;