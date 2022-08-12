var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');
const { OTPEmail, internal_team_of_LoanApp } = require('../config/db');

const { executeQuery, runStoredProcedure, runStoredProcedureOutput } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
const LoanApplicationModel = require('../Model/LoanApplicationModel');

var CurrentDateTime = require('../shared/CurrentDateTime');

const { SMSLoanApplicationSubmitted, SendinternalteamSMS } = require('../SMSTemplate/LoanApplicationSubmitted');

const EmailForLoanApplication = require('../EmailTemplate/EmailForLoanApplication');

const spAddLoanApplication = `sp_Post_LoanApplication`;
const viewApplication = 'vw_LoanApplication';
const tblpropertyowner = 'tbl_PropertyOwnerShip';
const tblApplication = 'tbl_Application';
const spViewApplicationAllID = 'sp_View_Application_AllID';
const spGETViewLoanApplicationDetails = `sp_GET_ViewLoanApplicationDetails`;

var POSTLoanApplicationCreate = async (req, res) => {

    const { CreatedBy, Email } = await { ...req.body };

    try {

        var model = await new modelBuilder().buildModel(req.body, new LoanApplicationModel());

        model.CreatedBy = CreatedBy;
        model.CreatedAt = CurrentDateTime();
        model.IpAddress = req.myCustomAttributeName;
        model.KhataNo = req.body.Khata_No

        var inputparams = [];

        await Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        const result = await runStoredProcedure(spAddLoanApplication, inputparams);
        var resultData = await result.recordset[0];
        var { PropertyID, AppID } = { ...resultData };

        var PropertyOwners = req.body.PropertyOwners ? req.body.PropertyOwners : null;

        if (!PropertyOwners) {
            return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "Application successfully Submited!!" }, new ResponseModel()));
        }

        var tempArray = [];
        var MsSqlQuery = '';

        const OwnerPromise = () => {

            return new Promise(async (resolve, reject) => {

                PropertyOwners.forEach(element => {

                    MsSqlQuery += SqlString.format(`INSERT INTO ${tblpropertyowner}
                (PropertyID, OwnerName) VALUES (?, ?);`, [PropertyID, element.OwnerName])

                    tempArray.push(element);

                    if (tempArray.length === PropertyOwners.length) resolve(MsSqlQuery);

                })

            })
        }

        const OwnerMsSqlQuery = await OwnerPromise();

        try {

            const Resultowner = await executeQuery(OwnerMsSqlQuery);
            var AppDetails = result.recordset[0];
            var { UserID } = { ...AppDetails };

            const SMSSend1 = SMSLoanApplicationSubmitted(CreatedBy);
            // const SMSSend2 = SMSLoanApplicationSubmitted(UserID);
            const SMSsend3 = SendinternalteamSMS();

            const ResultUserEmail = await executeQuery(SqlString.format(`Select EmailAddress From tbl_usermaster Where UserID = ?`, [CreatedBy]));

            const { EmailAddress } = await { ...ResultUserEmail.recordset[0] };



            const Email1 = await EmailForLoanApplication(EmailAddress, AppID, internal_team_of_LoanApp.Email);
            // const Email2 = await EmailForLoanApplication(Email, AppID, []);


            return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "Application successfully Submited!!" }, new ResponseModel()));

        } catch (err) {
            var errMessage = `An error occurred during Adding Property Owner data for Loan Application`;
            APIErrorLog(OwnerMsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

        }
    } catch (err) {
        var errMessage = `An error occurred during Add Loan Application`;
        APIErrorLog(spAddLoanApplication, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

var GETViewLoanApplicationDetails = async (req, res) => {
    var AppID = req.params.AppID;
    var inputparams = [];
    inputparams.push({
        "name": "AppID",
        "type": sql.BigInt,
        "value": AppID
    });
    const result = await runStoredProcedure(spGETViewLoanApplicationDetails, inputparams);
    var resultData = await result.recordset[0];
    res.status(200).send(new modelBuilder().buildModel({ status: 200, data: resultData }, new ResponseModel()));
    
}

var GETLoanApplicationViewBankManager = (req, res) => {
    var condition = SqlString.format(` AND CreatedBy = ? AND CreatedByUserType = 1`, [req.params.UserID])

    GETLoanApplicationView(req, res, condition);
}

var GETLoanApplicationViewApplicant = (req, res) => {
    var condition = SqlString.format(` AND ApplicantID = ?`, [req.params.UserID])

    GETLoanApplicationView(req, res, condition);
}

var GETLoanApplicationViewLawyer = (req, res) => {
    var condition = SqlString.format(` AND LawyerID = ?`, [req.params.UserID])

    GETLoanApplicationView(req, res, condition);
}

var GETLoanApplicationViewAdmin = (req, res) => {
    var condition = '';

    GETLoanApplicationView(req, res, condition);
}

var GETLoanApplicationViewByUserID = (req, res) => {

    const { UserID } = { ...req.params };

    if (+UserID < 1 || !+UserID) {
        var errMessage = `please pass numeric values for User ID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = SqlString.format(`EXeCute sp_ufTableOfLoanApplicationbyUserType_Demo @UserID = ?`, [UserID]);

    executeQuery(MsSqlQuery)
        .then(data => {

            var application = data.recordset;

            if (!application || application.length === 0) {
                return res.status(200).send(new modelBuilder().buildModel({
                    status: 200, data: [], message: "data successfully Fetched"
                }, new ResponseModel()));
            }
            else {
                return res.status(200).send(new modelBuilder().buildModel({
                    status: 200, data: application, message: "data successfully Fetched"
                }, new ResponseModel()));
               
            }
            // console.log(application.length, "app");
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Loan Application`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}
var GETLoanApplicationViewDetails = (req, res) => {
    var condition = SqlString.format(` AND AppID = ?`, [req.params.AppID])

    GETLoanApplicationView(req, res, condition);
}

var GETLoanApplicationView = (req, res, condition) => {

    var MsSqlQuery = SqlString.format(`SELECT * from ${viewApplication}  where 1=1 ${condition}  order by AppID desc`);

    executeQuery(MsSqlQuery)
        .then(data => {

            var application = data.recordset;
            console.log(application);
            if (application.length === 0) {
                return res.status(200).send(new modelBuilder().buildModel({
                    status: 200, data: data.recordset, message: "data successfully Fetched"
                }, new ResponseModel()));
            }
            else {
                var tempapp = [];
                application.forEach(element => {

                    MsSqlQuery = SqlString.format(`Select * from ${tblpropertyowner} where PropertyID  = ?`, [element.PropertyID])

                    executeQuery(MsSqlQuery)
                        .then(owner => {
                            tempapp.push({
                                ...element,
                                PropertyOwners: owner.recordset
                            })

                            if (tempapp.length === application.length) {
                                return res.status(200).send(new modelBuilder().buildModel({
                                    status: 200, data: tempapp, message: "data successfully Fetched"
                                }, new ResponseModel()));
                            }
                        })
                        .catch(err => {
                            var errMessage = `An error occurred during Fetching Loan Application Property Owner`;
                            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                        })
                })
            }

        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Loan Application`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var PUTUpadetApplicationStatus = (req, res) => {
    var Applicationstatus = req.body.ApplicationStatus;
    var AppID = req.params.AppID;

    var MsSqlQuery = SqlString.format(`UPDATE ${tblApplication} SET ApplicationStatus=? 
    WHERE AppID=?`, [Applicationstatus, AppID])
    executeQuery(MsSqlQuery)
        .then(data => {
            if (data.rowsAffected == 1) {
                res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.rowsAffected, message: "Application Status Successfully Updated!!" }, new ResponseModel()));
            } else {
                res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: 'Not_Found', message: "Records Not found" }, new ResponseModel()));
            }
        })
        .catch(err => {
            var errMessage = `An error occurred during Updating Application status`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var POSTApplicationALID = async (req, res) => {

    try {

        var { StateName, DistrictName, TalukaName, HobliName, VillageName, BankName, LoanType, LoanPropertyType
        } = await { ...req.body }

        var model = await {
            StateName: StateName == null ? 'Gujarat' : StateName,
            DistrictName,
            TalukaName,
            VillageName,
            HobliName,
            BankName,
            LoanType,
            LoanPropertyType
        }

        var inputparams = [];

        await Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        var Outputmodel = await {
            StateID: null,
            DistrictID: null,
            TalukaID: null,
            VillageID: null,
            HobliID: null,
            BankID: null,
            TypeOfLoan: null,
            LoanPropertyTypeID: null
        }

        var outputParams = [];

        Object.keys(Outputmodel).forEach(element => {
            outputParams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });


        var resultoutput = await runStoredProcedureOutput(spViewApplicationAllID, inputparams, outputParams)

        var ResultData = resultoutput.output

        if (ResultData) {
            return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: ResultData, message: "data successfully Fetched" }, new ResponseModel()));
        }


    } catch (err) {
        var errMessage = `An error occurred during Fetch Loan Application ALL requied ID`;
        APIErrorLog(spViewApplicationAllID, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var PUTUpadetECRequest = async (req, res) => {

    try {
        var { AppID } = { ...req.params }

        var MsSqlQuery = await SqlString.format(`Update ${tblApplication} SET EC_Request = 1 WHERE AppID = ?`, [AppID]);

        var ResultData = await executeQuery(MsSqlQuery);

        if (ResultData.rowsAffected == 1) {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: ResultData.rowsAffected, message: "Application EC_Request Successfully Updated!!" }, new ResponseModel()));
        } else {
            res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: 'Not_Found', message: "Records Not found" }, new ResponseModel()));
        }


    } catch (err) {
        var errMessage = `An error occurred during change Application EC_Request`;
        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}

router.post('/api/loan/application/create', POSTLoanApplicationCreate);

router.get('/api/loan/application/View/BankManager/:UserID', GETLoanApplicationViewByUserID);
router.get('/api/loan/application/View/Applicant/:UserID', GETLoanApplicationViewByUserID);
router.get('/api/loan/application/View/Lawyer/:UserID', GETLoanApplicationViewByUserID);
// router.get('/api/loan/application/View/Proplegit/:UserID', GETLoanApplicationCreate);
router.get('/api/loan/application/View/Admin/:UserID', GETLoanApplicationViewByUserID);

router.get('/api/loan/application/View/details/:AppID', GETLoanApplicationViewDetails);
router.get('/api/loan/application/Viewloan/details/:AppID', GETViewLoanApplicationDetails);
router.put('/api/loan/application/status/:AppID', PUTUpadetApplicationStatus);

router.post('/api/loan/application/ALL/ID', POSTApplicationALID);

router.put('/api/loan/application/ECRequest/:AppID', PUTUpadetECRequest);


module.exports = router;