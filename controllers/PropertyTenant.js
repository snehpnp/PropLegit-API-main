var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const multer = require('multer');
const { UploadFile, checkFile } = require('../shared/S3Bucket');
const GenerateRentInvoice = require('../shared/GenerateRentInvoice')
const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');

const upload = multer()

const { executeQuery, runStoredProcedure, UpdateQuery, runStoredProcedureOutput } = require('../MsSql/Query');
const { MssqldatetimeFormat, CurrentdatetimeFormat } = require('../shared/datetimeFormat');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var PropertyDocumentModel = require('../Model/PropertyDocumentModel');
var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var PropertyTenantModel = require('../Model/PropertyTenantModel');

var spPropertyAvailabilityForRent = `sp_POST_Check_PropertyAvailabilityForRent`;
var spUpload = 'sp_POST_PropertyDocument';
var spTenantAdd = `sp_POST_PropertyTenant`;
var tblTenant = `tbl_PropertyTenant`;
const vwTenantRent = `vw_PropertyTenantRent`;
const ContractCancel = 'sp_PUT_Tenant_ContractCancel';
var CurrentDateTime = require('../shared/CurrentDateTime');

const DocumentTypeIDForRent = 2;
const DocumentSubTypeIdForContract = 19;

var TenantWelcome = require('../EmailTemplate/TenantWelcome');
var SMSTenantWelcome = require('../SMSTemplate/TenantWelcome');
const EmailTenantContractCancel = require('../EmailTemplate/EmailTenantContractCancel');
const SMSTenantContractCancel = require('../SMSTemplate/SMSTenantContractCancel');

var POSTPropertyTenant = async (req, res) => {

    var { ContractStartDate, ContractMonth, CreatedBy, FileName, FileType, Description, } = await { ...req.body }
    var { PropertyID } = await { ...req.params }

    if (!ContractStartDate || !ContractMonth || !req.file) {
        var errMessage = `Please Pass Contract Start Date & Contract Month or Upload Contract Document`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    try {

        var model = await new modelBuilder().buildModel(req.body, new PropertyTenantModel());
        model.PropertyID = await PropertyID;
        model.IpAddress = await req.myCustomAttributeName;
        model.CreatedAt = await CurrentDateTime();
        model.CreatedBy = await CreatedBy;

        var inputparams = [];

        await Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        var outputParams = [];
        outputParams.push({
            "name": 'Error_Message',
            "type": sql.NVarChar,
            "value": null
        })

        const addtenant = await runStoredProcedureOutput(spTenantAdd, inputparams, outputParams);
        const { Error_Message } = await addtenant.output;
        const data = await addtenant.recordset[0];
        const { PropertyTenantID, RentType, PropertyRentID } = await { ...data };


        if (Error_Message) {

            var errMessage = Error_Message;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }

        const sentEmail = TenantWelcome(PropertyTenantID, CreatedBy);
        const sentSMS = SMSTenantWelcome(PropertyTenantID, CreatedBy);

        var model = await {
            PropertyID,
            DocumentTypeId: DocumentTypeIDForRent,
            DocumentSubTypeId: DocumentSubTypeIdForContract,
            Subdirectory: `Tenant-${PropertyTenantID}`,
            FileExistenceCheck: 0,
            IpAddress: null,
            FileName,
            FileType,
            Description,
            UserID: CreatedBy,
            CreatedBy
        }
        var DocumentResponce = await SaveDocumentGetDocumentID(model, req.file)

        if (DocumentResponce.FileExistence) {
            return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: DocumentResponce.errMessage }, new ResponseModel()));
        }

        var MsSqlQuery = await SqlString.format(`Update ${tblTenant} Set RentContractID = ? where PropertyTenantID = ?;`, [DocumentResponce.DocumentID, PropertyTenantID]);

        const addContaract = await executeQuery(MsSqlQuery);

        if (RentType != 'Receivable') {
            return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: { PropertyTenantID }, message: "Tenant Data Successfully Uploaded" }, new ResponseModel()));

        }
        const ForInvoice = await GenerateRentInvoice(PropertyRentID);

        return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: { PropertyTenantID }, message: "Tenant Data Successfully Uploaded" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Adding Property Tenant`;
        APIErrorLog(spTenantAdd, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

    }
}

var PUTPropertyTenant = (req, res) => {

    CheckPropertyAvailability(req, res, (isAvailable) => {

        if (!req.file) {
            UpdatePropertyTenant(req, res)
        } else {
            checkFile(req.params.PropertyID, DocumentTypeIDForRent, req.body.FileName, `Tenant-${req.params.PropertyTenantID}`)
                .then(data => {
                    if (data.code !== 'NotFound' && req.query.FileExistenceCheck == 1) {
                        var errMessage = `File already exists do you want to overwrite?`;
                        return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: errMessage }, new ResponseModel()));
                    }

                    UploadFile(req.file, req.params.PropertyID, DocumentTypeIDForRent, req.body.FileName, `Tenant-${req.params.PropertyTenantID}`)
                        .then(result => {

                            var model = new modelBuilder().buildModel(req.body, new PropertyDocumentModel());

                            model.PropertyID = req.params.PropertyID;
                            model.FileURL = result.Location;
                            model.Key = result.Key;
                            model.S3BucketName = result.Bucket;
                            model.IpAddress = req.myCustomAttributeName;
                            model.CreatedAt = CurrentDateTime();
                            model.CreatedBy = req.body.CreatedBy;
                            model.DocumentTypeId = DocumentTypeIDForRent;
                            model.DocumentSubTypeId = DocumentSubTypeIdForContract;

                            var inputparams = [];

                            Object.keys(model).forEach(element => {
                                inputparams.push({
                                    "name": element,
                                    "type": sql.NVarChar,
                                    "value": model[element] ? model[element] : null
                                })
                            });

                            runStoredProcedure(spUpload, inputparams)
                                .then(result => {

                                    var MsSqlQuery = SqlString.format(`Update ${tblTenant} Set RentContractID = ? where PropertyTenantID = ?`, [result.recordset[0].DocumentID, req.params.PropertyTenantID]);

                                    executeQuery(MsSqlQuery)
                                        .then(addContaract => {
                                            UpdatePropertyTenant(req, res)
                                        })
                                        .catch(err => {
                                            var errMessage = `An error occurred during Adding Property Tenant contract Details`;
                                            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                                        })

                                })
                                .catch(err => {
                                    var errMessage = `An error occurred during Adding Property Document`;
                                    APIErrorLog(spUpload, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                    res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                                })
                        })
                        .catch(err => {

                            var errMessage = `An error occurred during Uploading File`;
                            APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                        })


                })
                .catch(err => {
                    var errMessage = `An error occurred check during File exsistance.`;
                    APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                })
        }

    })

}

var UpdatePropertyTenant = (req, res) => {

    var model = new modelBuilder().buildModel(req.body, new PropertyTenantModel());

    model.PropertyID = req.params.PropertyID;
    model.IpAddress = req.myCustomAttributeName;
    model.ModifiedAt = CurrentDateTime();
    model.ModifiedBy = req.body.ModifiedBy;

    UpdateQuery(tblTenant, model, req.params.PropertyTenantID, 'PropertyTenantID')
        .then(MsSqlQuery => {


            executeQuery(MsSqlQuery)
                .then(updatetenant => {
                    res.status(200).send(new modelBuilder().buildModel({ status: 200, data: updatetenant.rowsAffected, message: "Tenant Data Successfully Uploaded" }, new ResponseModel()));
                })
                .catch(err => {
                    var errMessage = `An error occurred during Adding Property Tenant contract Details`;
                    APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                })

        })
        .catch(err => {
            var errMessage = `An error occurred during Updating Property Tenant Details`;
            APIErrorLog('Upload', err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

        })
}

var POSTCheckPropertyAvailability = (req, res) => {

    CheckPropertyAvailability(req, res, (isAvailable) => {

        return res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: [{
                isAvailable
            }], message: "Property Availability check  Successfully done"
        }, new ResponseModel()));

    })


}

var CheckPropertyAvailability = (req, res, callback) => {


    if (!req.body.ContractStartDate || !req.body.ContractEndDate) {
        var errMessage = `Please Pass Contract Start Date & Contract End Date`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var model = {
        PropertyID: req.params.PropertyID,
        ContractStartDate: req.body.ContractStartDate,
        ContractEndDate: req.body.ContractEndDate,
        RentedSpaceInSqmtr: req.body.RentedSpaceInSqmtr == undefined ? null : req.body.RentedSpaceInSqmtr,
        PropertyTenantID: req.body.PropertyTenantID == undefined ? (req.params.PropertyTenantID == undefined ? null : req.params.PropertyTenantID) : req.body.PropertyTenantID
    }

    var inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    outputParams = [{
        "name": 'Error',
        "type": sql.VarChar,
        "value": null
    }, {
        "name": 'isPropertyAvalible',
        "type": sql.Bit,
        "value": 0
    }]

    runStoredProcedureOutput(spPropertyAvailabilityForRent, inputparams, outputParams)
        .then(resultofAvailability => {

            var ResultofOutput = resultofAvailability.output;

            if (ResultofOutput && ResultofOutput.Error) {
                var errMessage = ResultofOutput.Error;
                return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
            }

            if (ResultofOutput && ResultofOutput.isPropertyAvalible == 1) {
                callback(true)
            }
            else {
                var errMessage = 'Property is not Avalible';
                return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
            }
        })
        .catch(err => {
            var errMessage = `An error occurred during Check Property Avaibility for rent`;
            APIErrorLog(spPropertyAvailabilityForRent, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));

        })

}

var GETPropertyTenant = (req, res) => {

    var MsSqlQuery = SqlString.format(`Select * from ${vwTenantRent} 
    where PropertyID = ? AND RentType = 'Payable'
    order by PropertyTenantID desc;
    Select * from ${vwTenantRent} 
    where PropertyID = ? AND RentType = 'Receivable'
    order by PropertyTenantID desc`, [req.params.PropertyID, req.params.PropertyID])

    executeQuery(MsSqlQuery)
        .then(gettenant => {
            res.status(200).send(new modelBuilder().buildModel({
                status: 200, data: {
                    'PayableTenant': gettenant.recordsets[0],
                    'ReceivableTenant': gettenant.recordsets[1]
                }, message: "Tenant Data Successfully Uploaded"
            }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Property Tenant List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

var DeletePropertyTenant = (req, res) => {
    var MsSqlQuery = SqlString.format(`Update ${tblTenant} set IsDelete = 1 where PropertyID = ? AND PropertyTenantID = ? `, [req.params.PropertyID, req.params.PropertyTenantID])

    executeQuery(MsSqlQuery)
        .then(gettenant => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: gettenant.rowsAffected, message: "Tenant Data Successfully Uploaded" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Property Tenant Disabled`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var PUTPropertyTenantContractCancel = async (req, res) => {

    const { PropertyTenantID } = await { ...req.params };

    if (!+PropertyTenantID || +PropertyTenantID < 1) {
        var errMessage = `please pass numeric values for Property Tenant ID`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    try {

        const model = await {
            PropertyTenantID,
            TodayDate: CurrentDateTime()
        }

        var inputparams = [];

        await Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        const gettenantdetails = await runStoredProcedure(ContractCancel, inputparams);
        const MasterData = await gettenantdetails.recordsets;
        const TenantInfo = await MasterData[0];
        const CancelEmail = await MasterData[1];
        const CancelSMS = await MasterData[2];

        const { TenantName, ContractStartDate, ContractEndDate, PostalAddress, ModifiedAt, TenantEmail } = await { ...TenantInfo[0] }

        const strformate = 'LL';

        const bodydata = await {
            TenantName,
            ContractStartDate: await MssqldatetimeFormat(ContractStartDate, strformate),
            ContractEndDate: await MssqldatetimeFormat(ContractEndDate, strformate),
            PropertyAddress: PostalAddress,
            TodayDate: await MssqldatetimeFormat(ModifiedAt, strformate),
            DistrictInChargeName: 'District In Charge'
        }

        const EmailSend = EmailTenantContractCancel(TenantInfo[0], bodydata, CancelEmail[0]);
        const SMSSend = SMSTenantContractCancel(TenantInfo[0], bodydata, CancelSMS[0]);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200, data: [], message: `Tenant ${TenantName}'s Contract Cancel Successfully`
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Property Tenant Contract Cancel`;
        APIErrorLog(ContractCancel, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

router.post('/api/property/:PropertyID/tenant/add', upload.single('uploadfile'), POSTPropertyTenant);
router.put('/api/property/:PropertyID/tenant/update/:PropertyTenantID', upload.single('uploadfile'), PUTPropertyTenant);

router.post('/api/property/:PropertyID/tenant/check', POSTCheckPropertyAvailability);

router.get('/api/property/:PropertyID/tenant/list', GETPropertyTenant);

router.delete('/api/property/:PropertyID/tenant/delete/:PropertyTenantID', DeletePropertyTenant);
router.put('/api/property/tenant/ContractCancel/:PropertyTenantID', PUTPropertyTenantContractCancel);

module.exports = router;