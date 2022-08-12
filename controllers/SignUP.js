var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery, runStoredProcedure, UpdateQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var SignUPModel = require('../Model/SignUPModel')

var CurrentDateTime = require('../shared/CurrentDateTime');
var { GeneratePassword } = require('../shared/Password');
var OTPGenerator = require('../shared/OTPGenerator');

var EmailOTP = require('../EmailTemplate/EmailOTP');
var SMSOTP = require('../SMSTemplate/SMSOTP');

var EmailWelcome = require('../EmailTemplate/EmailWelcome');
var SMSWelcome = require('../SMSTemplate/SMSWelcome')

var TableName = 'tbl_OTP_Log';
var spName = 'sp_POST_usermaster';
var spNameOTP = 'sp_POST_OTP';
var spNameOTPVerification = 'sp_POST_OTP_Verification';

var POSTRegister = (req, res) => {

    var model = new modelBuilder().buildModel(req.body, new SignUPModel());

    model.CreatedAt = CurrentDateTime();
    model.CreatedBy = req.body.CreatedBy;
    model.IpAddress = req.myCustomAttributeName;
    model.RegistrationDate = CurrentDateTime();

    if (!model.MobileNumber || !model.EmailAddress) {
        var errMessage = `Email and Mobile Can not be NULL`;
        APIErrorLog(null, null, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }
    else {
        GeneratePassword(model.Password)
            .then(hashpassword => {
                model.Password = hashpassword;

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
                        var signup = result.recordset[0];

                        if (signup && signup.isMobileNumberExist) {
                            var errMessage = `Mobile number is already registered`;
                            APIErrorLog(spName, null, req.headers, req.body, errMessage, req.method, req.params, req.query);
                            res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));

                        } else if (signup && signup.isEmailExist) {
                            var errMessage = `Email is already registered`;
                            APIErrorLog(spName, null, req.headers, req.body, errMessage, req.method, req.params, req.query);
                            res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
                        }
                        else {
                            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: result.recordset, message: "User successfully Inserted" }, new ResponseModel()));
                        }
                    })
                    .catch(err => {
                        var errMessage = `An error occurred during Register`;
                        APIErrorLog(spName, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                    })


            })
            .catch(err => {
                var errMessage = `An error occurred Password store during user Register`;
                APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            })
    }

}

var POSTGenerateOTP = (req, res) => {

    OTPGenerator()
        .then(otparray => {

            var date = CurrentDateTime();

            var model = {
                UserID: req.params.UserID,
                TransactionType: req.body.TransactionType,
                EmailOTP: otparray[0],
                SMSOTP: otparray[1],
                OTPGenreatedOn: date,
                CreatedAt: date,
                CreatedBy: req.body.CreatedBy,
                CreatedIPAddress: req.myCustomAttributeName,
            }

            var inputparams = [];

            Object.keys(model).forEach(element => {
                inputparams.push({
                    "name": element,
                    "type": sql.NVarChar,
                    "value": model[element] ? model[element] : null
                })
            });

            runStoredProcedure(spNameOTP, inputparams)
                .then(result => {

                    var output = [
                        {
                            "ID": result.recordset[0].OTPLogID,
                            "TransactionMode": result.recordset[0].TransactionMode,
                            "OTPValidTill": result.recordset[0].OTPValidTill,
                            "OTP": null
                        }, {
                            "ID": result.recordset[1].OTPLogID,
                            "TransactionMode": result.recordset[1].TransactionMode,
                            "OTPValidTill": result.recordset[1].OTPValidTill,
                            "OTP": null
                        }]

                    var SendOTPArray = result.recordset;
                    var i = SendOTPArray.length;

                    SendOTPArray.forEach(element => {

                        if (element.TransactionMode === 'Email') {
                            EmailOTP(element, 1).then(data => {
                                i--;

                                if (i === 0) {
                                    return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: output, message: "OTP has been sent to your registered mobile number and email id" }, new ResponseModel()));
                                }
                            })
                                .catch(err => {
                                    var errMessage = err.errMessage;
                                    APIErrorLog(err.Name, err.err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                    return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: err.error_code, error: errMessage }, new ResponseModel()));
                                })

                        } else if (element.TransactionMode === 'SMS') {
                            SMSOTP(element, 2).then(data => {
                                i--;

                                if (i === 0) {
                                    return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: output, message: "OTP has been sent to your registered mobile number and email id" }, new ResponseModel()));
                                }
                            })
                                .catch(err => {
                                    var errMessage = err.errMessage;
                                    APIErrorLog(err.Name, err.err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                    return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: err.error_code, error: errMessage }, new ResponseModel()));
                                })
                        }

                    })

                })
                .catch(err => {
                    var errMessage = `An error occurred during Genrate OTP in server`;
                    APIErrorLog(spNameOTP, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                })

        })
        .catch(err => {
            APIErrorLog(null, err, req.headers, req.body, null, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

var POSTValidateOTP = (req, res) => {

    var EmailData = req.body.Email;
    var SMSData = req.body.SMS;
    const { DeviceID } = { ...req.body }

    if (EmailData && SMSData) {
        var model = {
            date: CurrentDateTime(),
            EmailID: EmailData.ID,
            EmailOTP: EmailData.OTP,
            SMSID: SMSData.ID,
            SMSOTP: SMSData.OTP,
            ModifiedBy: req.body.ModifiedBy,
            ModifiedIPAddress: req.myCustomAttributeName,
            DeviceID
        }

        var inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        runStoredProcedure(spNameOTPVerification, inputparams)
            .then(result => {

                if (result.recordset.length > 0 && result.recordset[0].IsValidated) {

                    if (result.recordset.length != 0) {

                        var UserID = result.recordset[0].UserID ? result.recordset[0].UserID : null;
                        var FirstName = result.recordset[0].FirstName ? result.recordset[0].FirstName : null;
                        var LastName = result.recordset[0].LastName ? result.recordset[0].LastName : null;
                    }

                    res.status(200).send(new modelBuilder().buildModel({ status: 200, data: [{ FirstName, LastName, UserID, IsMobileVerified: result.recordset[0].IsMobileVerified, IsEmailVerified: result.recordset[0].IsEmailVerified, CompanyID: result.recordset[0].CompanyID }], message: "Authorized User" }, new ResponseModel()));
                }
                else if (result.recordset.length > 0 && !result.recordset[0].EmailOTPMatch) {
                    var errMessage = `You enter wrong otp for email verification.`;
                    APIErrorLog(spNameOTPVerification, null, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
                }
                else if (result.recordset.length > 0 && !result.recordset[0].MobileOTPMatch) {
                    var errMessage = `You enter wrong otp for Mobile Number verification.`;
                    APIErrorLog(spNameOTPVerification, null, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
                }
                else {
                    var errMessage = `Unauthorized User`;
                    APIErrorLog(spNameOTPVerification, null, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
                }
            })
            .catch(err => {
                var errMessage = `An error occurred during OTP Validation`;
                APIErrorLog(spNameOTPVerification, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            })

    } else {
        var errMessage = `Invalid Post request data`;
        APIErrorLog(null, null, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }


}

router.post('/api/login/register', POSTRegister);
router.post('/api/generate/otp/:UserID', POSTGenerateOTP);
router.post('/api/validate/otp', POSTValidateOTP);

module.exports = router;