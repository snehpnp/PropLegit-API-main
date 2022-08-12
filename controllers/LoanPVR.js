const router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql')
const multer = require('multer');

const { executeQuery, runStoredProcedure, runStoredProcedureTblinput } = require('../MsSql/Query');
const { UploadFile, checkFile, GetFileObject } = require('../shared/S3Bucket');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');
const GenrateAndStordPVRDocument = require('../PdfTemplate/PVRDocument');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var PVRMasterModel = require('../Model/PVRMasterModel');
var PropertyDocumentModel = require('../Model/PropertyDocumentModel');

var CurrentDateTime = require('../shared/CurrentDateTime');

const SMSLoanPVRGenrated = require('../SMSTemplate/PVRGenrated');
const EmailLoanPVRGenrated = require('../EmailTemplate/PVRGenrated');
const { max } = require('moment');

const fnPropertyDocument = 'dbo.ufTableOfPropertyDocumentByAppID';

const upload = multer()
// const uploadMultiple = multer({
//     fileFilter: (req, file, cb) => {

//         if (file.mimetype == "application/pdf") {
//             cb(null, true);
//         } else {
//             cb(null, false);
//             // return cb(new Error('Only .pdf format allowed!'));
//         }
//     }
// }).array("FileArray")

const spName = 'sp_POST_PVRMaster';
const spPVROther = 'sp_POST_PVRDetails';
const viewApplication = 'vw_LoanApplication';
const tblPVRMaster = 'tbl_PVRMaster';
const tblPVRCropDetails = 'tbl_PVRCropDetails';
const tblPVREncumbranceReport = 'tbl_PVREncumbranceReport';
const tblPVROwnerDetails = 'tbl_PVROwnerDetails';
var spNamePropertyDocument = 'sp_POST_PropertyDocument';

const LoanPVRDocumentID = 17;

var POSTLoanPVRCreate = (req, res) => {
    var model = new modelBuilder().buildModel(req.body, new PVRMasterModel())

    model.AppID = req.params.AppID
    model.IpAddress = req.body.IpAddress;
    model.CreatedAt = CurrentDateTime();
    model.CreatedBy = req.body.CreatedBy;

    var inputparams = []

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    })
    runStoredProcedure(spName, inputparams)
        .then(result => {

            POSTCROPDETAILS(req, res, result.recordset[0].PVRID)
        })
        .catch(err => {
            var errMessage = `An error occurred during Adding PVR data`;
            APIErrorLog(spName, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

var POSTCROPDETAILS = (req, res, PVRID) => {

    var PVRCropDetails = req.body.CropDetails ? req.body.CropDetails : [];
    var PVREncumbranceReport = req.body.EncumbranceDetails ? req.body.EncumbranceDetails : [];
    var PVROwnerCoOwnersName = req.body.OwnerCoOwnersName ? req.body.OwnerCoOwnersName : [];

    if (PVRCropDetails.length > 0 || PVREncumbranceReport.length > 0 || PVROwnerCoOwnersName.length > 0) {
        var temp_PVRCropDetails = new sql.Table();
        var temp_PVREncumbranceReport = new sql.Table();
        var temp_PVROwnerCoOwnersName = new sql.Table();

        // Columns must correspond with type we have created in database.
        temp_PVRCropDetails.columns.add("PVRID", sql.BigInt);
        temp_PVRCropDetails.columns.add("Year", sql.VarChar(100));
        temp_PVRCropDetails.columns.add("Season", sql.VarChar(100));
        temp_PVRCropDetails.columns.add("CropName", sql.VarChar(255));
        temp_PVRCropDetails.columns.add("CropAreaInSquareMeters", sql.Decimal(18, 2));
        temp_PVRCropDetails.columns.add("CropMSP", sql.Decimal(18, 2));

        // Columns must correspond with type we have created in database.
        temp_PVREncumbranceReport.columns.add("PVRID", sql.BigInt);
        temp_PVREncumbranceReport.columns.add("LoanTakenBy", sql.VarChar(255));
        temp_PVREncumbranceReport.columns.add("LoanAmount", sql.Decimal(18, 2));
        temp_PVREncumbranceReport.columns.add("LoanTakenOn", sql.VarChar(255));
        temp_PVREncumbranceReport.columns.add("LoanGivenBy", sql.VarChar(255));

        // Columns must correspond with type we have created in database.
        temp_PVROwnerCoOwnersName.columns.add("PVRID", sql.BigInt);
        temp_PVROwnerCoOwnersName.columns.add("OwnerName", sql.NVarChar(max));
		temp_PVROwnerCoOwnersName.columns.add("LandSize", sql.NVarChar(max));

        // Add data into the table that will be pass into the procedure  
        for (var i = 0; i < PVRCropDetails.length; i++) {
            temp_PVRCropDetails.rows.add(PVRID, PVRCropDetails[i].Year, PVRCropDetails[i].Season, PVRCropDetails[i].Crop, PVRCropDetails[i].Area, PVRCropDetails[i].MSP);
        }

        for (var i = 0; i < PVREncumbranceReport.length; i++) {
            temp_PVREncumbranceReport.rows.add(PVRID, PVREncumbranceReport[i].LoanTakenBy, PVREncumbranceReport[i].LoanAmount, PVREncumbranceReport[i].LoanTakenOn, PVREncumbranceReport[i].LoanGivenBy);
        }

        for (var i = 0; i < PVROwnerCoOwnersName.length; i++) {
            temp_PVROwnerCoOwnersName.rows.add(PVRID, PVROwnerCoOwnersName[i].OwnersName, PVROwnerCoOwnersName[i].LandSize);
        }

        var inputparams = [];
        inputparams.push({
            name: 'temp_PVRCropDetails',
            value: temp_PVRCropDetails
        }, {
            name: 'temp_PVREncumbranceReport',
            value: temp_PVREncumbranceReport
        }, {
            name: 'temp_PVROwnerCoOwnersName',
            value: temp_PVROwnerCoOwnersName
        })

        runStoredProcedureTblinput(spPVROther, inputparams)
            .then(result => {

                return res.status(200).send(new modelBuilder().buildModel({
                    status: 200, data: [{
                        PVRID
                    }], message: "PVR Successfully Added!!"
                }, new ResponseModel()));
            })
            .catch(err => {
                var errMessage = `An error occurred during Processing iPVR data`;
                APIErrorLog(spPVROther, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            })
    }
    else {
        return res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: [{
                PVRID
            }], message: "iPVR Successfully Added!!"
        }, new ResponseModel()));
    }
}

var LoanPVRView = (AppID) => {

    return new Promise(async (resolve, reject) => {

        var MsSqlQuery = await SqlString.format(`SELECT * from ${viewApplication}  where AppID = ?;
    SELECT Top 1 * from ${tblPVRMaster}  where AppID = ?;
    SELECT * from ${tblPVRCropDetails}  where PVRID = (Select Top 1 PVRID from ${tblPVRMaster}  where AppID = ?);
    SELECT * from ${tblPVREncumbranceReport}  where PVRID = (Select  Top 1 PVRID from ${tblPVRMaster}  where AppID = ?);
    SELECT * from ${tblPVROwnerDetails}  where PVRID = (Select  Top 1 PVRID from ${tblPVRMaster}  where AppID = ?);
    `, [AppID, AppID, AppID, AppID, AppID]);

        try {
            var data = await executeQuery(MsSqlQuery);
            resolve({
                ...data.recordset[0],
                ...data.recordsets[1][0],
                PVRCropDetails: data.recordsets[2],
                EncumbranceReport: data.recordsets[3],
                PVROwnerDetails: data.recordsets[4]
            });
        } catch (err) {
            reject(err);
        }
    })
}

var GETLoanPVRView = async (req, res) => {

    try {
        var resultData = await LoanPVRView(req.params.AppID);
        return res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: resultData, message: "PVR Successfully fetch!!"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching Loan PVR Application`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

var POSTLoanPVRGenrate = (req, res) => {

    if (!req.file) {
        var errMessage = `Please Upload Document File`;
        res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    } else {

        var MsSqlQuery = SqlString.format(`Select Top 1 * from ${viewApplication} where AppID = ?`, [req.params.AppID]);

        executeQuery(MsSqlQuery)
            .then(ApplicationData => {
                var AppData = ApplicationData.recordset[0];
                var { PropertyID, ApplicantID, CreatedBy } = { ...AppData }

                if (!PropertyID) {
                    var errMessage = `Please Add Property Data`;
                    return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
                }

                checkFile(PropertyID, LoanPVRDocumentID, req.body.FileName)
                    .then(data => {

                        if (data.code !== 'NotFound' && req.query.FileExistenceCheck == 1) {
                            var errMessage = `File already exists do you want to overwrite?`;
                            return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: errMessage }, new ResponseModel()));
                        }

                        UploadFile(req.file, PropertyID, LoanPVRDocumentID, req.body.FileName)
                            .then(result => {

                                var model = new modelBuilder().buildModel(req.body, new PropertyDocumentModel());

                                model.PropertyID = PropertyID;
                                model.FileURL = result.Location;
                                model.Key = result.Key;
                                model.S3BucketName = result.Bucket;
                                model.IpAddress = req.myCustomAttributeName;
                                model.CreatedAt = CurrentDateTime();
                                model.CreatedBy = req.body.CreatedBy;
                                model.DocumentTypeId = LoanPVRDocumentID;

                                var inputparams = [];

                                Object.keys(model).forEach(element => {
                                    inputparams.push({
                                        "name": element,
                                        "type": sql.NVarChar,
                                        "value": model[element] ? model[element] : null
                                    })
                                });

                                runStoredProcedure(spNamePropertyDocument, inputparams)
                                    .then(result => {


                                        var Document = result.recordset[0];

                                        var { DocumentID } = { ...Document };

                                        MsSqlQuery = SqlString.format(`Update ${tblPVRMaster} set PVRDocumentID = ?, PVRStatus = 'PVR Completed' where AppID = ?`, [DocumentID, req.params.AppID])

                                        executeQuery(MsSqlQuery)
                                            .then(PVRDocument => {

                                                SMSLoanPVRGenrated(ApplicantID)
                                                    .then(SMSApplicant => {

                                                        SMSLoanPVRGenrated(CreatedBy)
                                                            .then(SMSBankManager => {

                                                                var Document = result.recordset[0]
                                                                var { DocumentID } = { ...Document };

                                                                EmailLoanPVRGenrated(ApplicantID, DocumentID)
                                                                    .then(EmailUser => {

                                                                        EmailLoanPVRGenrated(CreatedBy, DocumentID)
                                                                            .then(EmailCreatedby => {
                                                                                res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "PVR successfully Uploaded!!!" }, new ResponseModel()));
                                                                            })
                                                                            .catch(err => {
                                                                                var errMessage = `An error occurred PVR Email Send to Bank Manager`;
                                                                                APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                                                                return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                                                                            })

                                                                    })
                                                                    .catch(err => {
                                                                        var errMessage = `An error occurred PVR Email Send to Applicant`;
                                                                        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                                                        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

                                                                    })



                                                            })
                                                            .catch(err => {
                                                                var errMessage = `An error occurred PVR SMS Send to Bank Manager`;
                                                                APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                                                return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                                                            })

                                                    })
                                                    .catch(err => {
                                                        var errMessage = `An error occurred PVR SMS Send to Applicant`;
                                                        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                                        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                                                    })

                                            })
                                            .catch(err => {
                                                var errMessage = `An error occurred PVR Document ID update`;
                                                APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                                return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                                            })


                                    })
                                    .catch(err => {
                                        var errMessage = `An error occurred during Adding Property Document`;
                                        APIErrorLog(spNamePropertyDocument, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                                    })
                            })
                            .catch(err => {

                                if (err === 'Invalid DocumentType') {
                                    res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'INVALID_TYPE', error: err }, new ResponseModel()));

                                } else if (err === 'File already exists') {
                                    res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'FILE_EXISTS', error: err }, new ResponseModel()));

                                } else {
                                    var errMessage = `An error occurred during Uploading File`;
                                    APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                    res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                                }
                            })


                    })
                    .catch(err => {
                        var errMessage = `An error occurred check during File exsistance.`;
                        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                    })


            })
            .catch(err => {
                var errMessage = `An error occurred PVR Genrate/Upload`;
                APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            })
    }
}

var GETLoanPVRGenrate = async (req, res) => {

    try {
        var { AppID } = { ...req.params }
        var resultData = await LoanPVRView(AppID);
        var DocumentResponce = await GenrateAndStordPVRDocument(resultData);

        if (DocumentResponce.FileExistence) {
            return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
        }

        var MsSqlQuery = await SqlString.format(`Update ${tblPVRMaster} set PVRDocumentID = ?, PVRStatus = 'iPVR Completed' where AppID = ?`, [DocumentResponce.DocumentID, AppID])

        var updateResult = await executeQuery(MsSqlQuery);

        var { ApplicantID, CreatedBy } = { ...resultData }

        SMSLoanPVRGenrated(ApplicantID);
        SMSLoanPVRGenrated(CreatedBy);
        EmailLoanPVRGenrated(ApplicantID, DocumentResponce.DocumentID);
        EmailLoanPVRGenrated(CreatedBy, DocumentResponce.DocumentID);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: [DocumentResponce], message: "PVR successfully Uploaded!!!" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching Loan PVR Application`;
        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var GETLoanPVRGenrateANDMerge = async (req, res) => {

    try {
        var { AppID } = { ...req.params }

        var MsSqlQuery = await SqlString.format(`Select * from ${fnPropertyDocument}(?) where DocumentID IS NOT NULL 
        order by CASE WHEN DocumentName = N'Govt. certified copy of latest 7/12' THEN '1'
              WHEN DocumentName = N'Govt. certified copy of latest 8/A' THEN '2'
              WHEN DocumentName = N'Encumbrance Certificate' THEN '3'
			  WHEN DocumentName = N'Property Card' THEN '4'
              ELSE DocumentName END ASC`, [AppID])

        var Resultdocument = await executeQuery(MsSqlQuery);
        var documentArray = await Resultdocument.recordset.map(function (currentValue, Index) {
            currentValue.SERIAL_NO = Index + 1
            return currentValue
        });

        const buffrPromise = () => {
            return new Promise(async (resolve, reject) => {
                var buffArray = [];

                if (documentArray.length === 0) resolve([]);

                await documentArray.forEach(async (ele) => {

                    var fileobj = await GetFileObject(ele.Key)
                    await buffArray.push({
                        SERIAL_NO: ele.SERIAL_NO,
                        buffer: fileobj.Body
                    })

                    if (buffArray.length === documentArray.length) resolve(buffArray)
                })


            });
        }

        const buffArrayResult = await buffrPromise();

        const buffArrayResultsort = await buffArrayResult.sort((a, b) => a.SERIAL_NO - b.SERIAL_NO).map(a => a.buffer)

        var resultData = await LoanPVRView(AppID);

        var DocumentResponce = await GenrateAndStordPVRDocument(resultData, buffArrayResultsort);

        if (DocumentResponce.FileExistence) {
            return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
        }

        MsSqlQuery = await SqlString.format(`Update ${tblPVRMaster} set PVRDocumentID = ?, PVRStatus = 'iPVR Completed' where AppID = ?`, [DocumentResponce.DocumentID, AppID])

        var updateResult = await executeQuery(MsSqlQuery);

        var { ApplicantID, ApplicationCreatedBy } = { ...resultData }

        // SMSLoanPVRGenrated(ApplicantID);
        SMSLoanPVRGenrated(ApplicationCreatedBy);
        // EmailLoanPVRGenrated(ApplicantID, DocumentResponce.DocumentID);
        EmailLoanPVRGenrated(ApplicationCreatedBy, DocumentResponce.DocumentID);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: [DocumentResponce], message: "iPVR successfully Uploaded!!!" }, new ResponseModel()));


    } catch (err) {
        var errMessage = `An error occurred during Fetching Loan PVR Application`;
        APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }

}

var GETLoanPVRDetailsRead = async (req, res) => {

    const { AppID } = await { ...req.params };

    if (!+AppID || +AppID < 1) {
        var errMessage = `please pass numeric values for AppIDvalue!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = SqlString.format(`Select Top 1 * from tbl_aiIPVR Where Application_id = ?`, [AppID]);

    try {
        const data = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: data.recordset, message: "data successfully Fetched"
        }, new ResponseModel()));
    } catch (err) {
        var errMessage = `An error occurred during iPVR details read`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}


router.post('/api/loan/pvr/createBy/:AppID', POSTLoanPVRCreate);
router.get('/api/loan/pvr/View/:AppID', GETLoanPVRView);
router.post('/api/loan/pvr/Genrate/:AppID', upload.single('uploadfile'), POSTLoanPVRGenrate);
router.get('/api/loan/pvr/Genrate/:AppID', GETLoanPVRGenrate);
// router.post('/api/loan/pvr/Genrate/merge/:AppID', uploadMultiple, POSTLoanPVRGenrateANDMerge);
router.get('/api/loan/pvr/Genrate/merge/:AppID', GETLoanPVRGenrateANDMerge);

router.get('/api/loan/pvr/details/read/:AppID', GETLoanPVRDetailsRead);



module.exports = router;