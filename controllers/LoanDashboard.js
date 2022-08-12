var router = require('express').Router();
const sql = require('mssql');

const { runStoredProcedureOutput, runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var LoanDashboardFilterModel = require('../Model/LoanDashboardFilterModel');

const spGETLoanApplicationCount = 'sp_GET_LoanApplicationCount';
const spGETLoanAssignLawyerCount = 'sp_GET_LoanAssignLawyerPendingCount';
const spGETLoanDocumentsPendingCount = `sp_GET_LoanDocumentsPendingCount`;
const spGETLoanAssignmentReceived = `sp_GET_LoanAssignmentReceived`;
const spGETLoanSearchInProgress = 'sp_GET_LoanSearchInProgress'
const spGETPublicNoticeInProgress = 'sp_GET_PublicNoticeInProgress';
const spGETTitleClearInProgress = 'sp_GET_TitleClearInProgress';
const spGETLoanPVRInProgress = 'sp_GET_LoanPVRInProgress';
const spGETLoanPVRSent = 'sp_GET_LoanPVRSent';
const spGETLoanApplicationECRequest = 'sp_GET_LoanApplication_EC_Request';
const spGETLoanTypePVRStatus = 'sp_GET_LoanType_PVR_Status';

var POSTLoanDashBoard = async (req, res) => {

    try {
        var model = await new modelBuilder().buildModel(req.body, new LoanDashboardFilterModel());

        var inputparams = [];

        await Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        outputParams = await [{
            "name": 'Count',
            "type": sql.BigInt,
            "value": null
        }, {
            "name": 'CountWithFilter',
            "type": sql.BigInt,
            "value": null
        }];


        var resultCount = null;
        var OutputData = {};

        resultCount = await runStoredProcedureOutput(spGETLoanApplicationCount, inputparams, outputParams)

        OutputData.ApplicationsReceived = await resultCount.output;

        resultCount = await runStoredProcedureOutput(spGETLoanAssignLawyerCount, inputparams, outputParams);

        OutputData.LawyerAssignmentPending = resultCount.output;

        resultCount = await runStoredProcedureOutput(spGETLoanDocumentsPendingCount, inputparams, outputParams);

        OutputData.DocumentsPending = resultCount.output;

        resultCount = await runStoredProcedureOutput(spGETLoanAssignmentReceived, inputparams, outputParams)

        OutputData.LoanAssignmentReceived = resultCount.output;

        resultCount = await runStoredProcedureOutput(spGETLoanSearchInProgress, inputparams, outputParams)

        OutputData.LoanSearchInProgress = resultCount.output;

        resultCount = await runStoredProcedureOutput(spGETPublicNoticeInProgress, inputparams, outputParams)

        OutputData.PublicNoticeInProgress = resultCount.output;

        resultCount = await runStoredProcedureOutput(spGETTitleClearInProgress, inputparams, outputParams)

        OutputData.TitleClearInProgress = resultCount.output;

        resultCount = await runStoredProcedureOutput(spGETLoanPVRInProgress, inputparams, outputParams)

        OutputData.LoanPVRInProgress = resultCount.output;

        resultCount = await runStoredProcedureOutput(spGETLoanPVRSent, inputparams, outputParams)

        OutputData.LoanPVRSent = resultCount.output;

        resultCount = await runStoredProcedureOutput(spGETLoanApplicationECRequest, inputparams, outputParams)

        OutputData.LoanApplicationECRequest = resultCount.output;

        return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: OutputData, message: "data successfully Fetched" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Loan Dashboard Count`;
        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }

}

var GETLoanDashBoardLoantypePVRStatus = async (req, res) => {

    try {

        var { UserID } = await { ...req.params }

        var model = {
            UserID
        }

        var inputparams = [];

        await Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        var result = await runStoredProcedure(spGETLoanTypePVRStatus, inputparams);

        return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "data successfully Fetched" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Loan Dashboard Count`;
        APIErrorLog(spGETLoanTypePVRStatus, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}



router.post('/api/loan/Dashboard/Count', POSTLoanDashBoard);
router.get('/api/loan/Dashboard/loantype/PVR/status/:UserID', GETLoanDashBoardLoantypePVRStatus);

module.exports = router;