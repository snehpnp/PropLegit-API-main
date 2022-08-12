var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery, runStoredProcedure, runStoredProcedureOutput } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var CurrentDateTime = require('../shared/CurrentDateTime');
var { GeneratePassword } = require('../shared/Password');
var OTPGenerator = require('../shared/OTPGenerator');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');

var { CheckPassword } = require('../shared/Password');

var EmailOTP = require('../EmailTemplate/EmailOTP');
var SMSOTP = require('../SMSTemplate/SMSOTP');

var TableName = 'tbl_usermaster';
var spNameOTP = 'sp_POST_OTP';
var spNameOTPVerification = 'sp_POST_OTP_Verification';
const Check_DeviceID = 'sp_GET_Login_With_DeviceID';

var POSTLoginVerify = (req, res) => {

    const { DeviceID } = { ...req.body };

    var MsSqlQuery = SqlString.format(`Select UserID, Password, FirstName,LastName, IsMobileVerified, IsEmailVerified, IsDelete from ${TableName} where (EmailAddress = ? OR MobileNumber = ?)`, [req.body.EmailORMobile, req.body.EmailORMobile]);

    executeQuery(MsSqlQuery)
        .then(data => {

            var Password = null;

            if (data.recordset[0] && data.recordset[0].IsDelete != 0) {
                var errMessage = `Your account activation is in process. you will be intimated once activation process is completed`;
                return res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
            }

            if (data.recordset.length != 0) {
                // var UserID = data.recordset[0].UserID ? data.recordset[0].UserID : null;
                Password = data.recordset[0].Password ? data.recordset[0].Password : null;
                // var FirstName = data.recordset[0].FirstName ? data.recordset[0].FirstName : null;
                // var LastName = data.recordset[0].LastName ? data.recordset[0].LastName : null;
            }

            if (req.body.Password && Password) {

                CheckPassword(req.body.Password, Password)
                    .then(IsValid => {
                        if (IsValid) {

                            if (DeviceID) {
                                DeviceLogin(req, res, { UserID: data.recordset[0].UserID, DeviceID })
                            } else {
                                SameOTPGenerator(req, res, data.recordset[0], 6, 8)
                            }
                        }
                        else {
                            var errMessage = `You enter the wrong password`;
                            res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
                        }
                    })
                    .catch(err => {
                        var errMessage = `You enter the wrong password`;
                        res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
                    })

            } else {
                var errMessage = `Unauthorized User`;
                APIErrorLog(MsSqlQuery, null, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
            }

        })
        .catch(err => {
            var errMessage = `An error occurred during Login`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

var POSTForgotPassword = (req, res) => {

    if (!req.body.EmailORMobile) {
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: 'Please Pass Email OR Mobile' }, new ResponseModel()));

    } else {
        var MsSqlQuery = SqlString.format(`Select UserID, Password, FirstName,LastName, IsMobileVerified, IsEmailVerified from ${TableName} where (IsDelete != 1 OR ISDelete IS NULL) AND (EmailAddress = ? OR MobileNumber = ?)`, [req.body.EmailORMobile, req.body.EmailORMobile]);

        executeQuery(MsSqlQuery)
            .then(users => {
                var user = users.recordset[0];

                if (user) {
                    SameOTPGenerator(req, res, user, 5, 7)
                }
                else {
                    var errMessage = `Unauthorized User`;
                    APIErrorLog(MsSqlQuery, null, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
                }
            })
            .catch(err => {
                var errMessage = `An error occurred Forgot Password User Verification.`;
                APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            })
    }
}

var SameOTPGenerator = (req, res, user, EmailtemplateID, SMStemplateID) => {

    OTPGenerator()
        .then(otparray => {

            var date = CurrentDateTime();

            var model = {
                UserID: user.UserID,
                TransactionType: req.body.TransactionType,
                EmailOTP: otparray[0],
                SMSOTP: otparray[0],
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

                    var output =
                    {
                        "UserID": user.UserID,
                        "OTPLogID": result.recordset[0].OTPLogID,
                        "OTPValidTill": result.recordset[0].OTPValidTill,
                        "OTP": null
                    }

                    var SendOTPArray = result.recordset;
                    var i = SendOTPArray.length;

                    SendOTPArray.forEach(element => {

                        if (element.TransactionMode === 'Email') {
                            EmailOTP(element, EmailtemplateID).then(data => {
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
                            SMSOTP(element, SMStemplateID).then(data => {
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
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: null }, new ResponseModel()));
        })


}

var PUTForgotPassword = (req, res) => {

    var model = {
        date: CurrentDateTime(),
        EmailID: req.body.OTPLogID,
        EmailOTP: req.body.OTP,
        SMSID: Number(req.body.OTPLogID) + 1,
        SMSOTP: req.body.OTP,
        ModifiedBy: null,
        ModifiedIPAddress: req.myCustomAttributeName
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
            if (result.recordset[0].IsValidated) {
                if (result.recordset.length != 0) {
                    var UserID = result.recordset[0].UserID ? result.recordset[0].UserID : null;
                    var FirstName = result.recordset[0].FirstName ? result.recordset[0].FirstName : null;
                    var LastName = result.recordset[0].LastName ? result.recordset[0].LastName : null;
                }

                if (req.body.Password) {
                    GeneratePassword(req.body.Password)
                        .then(hashpassword => {

                            var MsSqlQuery = SqlString.format(`Update ${TableName} set Password = ? where UserID = ?`, [hashpassword, UserID]);

                            executeQuery(MsSqlQuery)
                                .then(UpdatePassword => {

                                    if (UpdatePassword.rowsAffected[0] === 1) {
                                        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: [{ FirstName, LastName, UserID, IsMobileVerified: result.recordset[0].IsMobileVerified, IsEmailVerified: result.recordset[0].IsEmailVerified }], message: "Authorized User" }, new ResponseModel()));
                                    } else {
                                        var errMessage = `Unauthorized User`;
                                        res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
                                    }
                                })
                                .catch(err => {
                                    var errMessage = `An error occurred Forgot Password Update`;
                                    APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                    res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                                })
                        })
                        .catch(err => {
                            var errMessage = `An error occurred Password store during user Forgot password`;
                            APIErrorLog(null, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                        })

                } else {
                    return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: 'Please Pass Password' }, new ResponseModel()));
                }
            }
            else {
                var errMessage = `The OTP you've entered is incorrect. Pleases try again.`;
                res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
            }
        })
        .catch(err => {
            var errMessage = `An error occurred during OTP Validation`;
            APIErrorLog(spNameOTPVerification, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var POSTLoginOTPVerify = (req, res) => {

    var model = {
        date: CurrentDateTime(),
        EmailID: req.body.OTPLogID,
        EmailOTP: req.body.OTP,
        SMSID: Number(req.body.OTPLogID) + 1,
        SMSOTP: req.body.OTP,
        ModifiedBy: null,
        ModifiedIPAddress: req.myCustomAttributeName
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
            if (result.recordset[0].IsValidated && result.recordset.length != 0) {

                var UserID = result.recordset[0].UserID ? result.recordset[0].UserID : null;
                var FirstName = result.recordset[0].FirstName ? result.recordset[0].FirstName : null;
                var LastName = result.recordset[0].LastName ? result.recordset[0].LastName : null;
                var CompanyUserMasterID = result.recordset[0].CompanyUserMasterID ? result.recordset[0].CompanyUserMasterID : null;
                var UserType = result.recordset[0].UserType ? result.recordset[0].UserType : null;
                var CompanyID = result.recordset[0].CompanyID ? result.recordset[0].CompanyID : null;

                res.status(200).send(new modelBuilder().buildModel({
                    status: 200, data: [{
                        FirstName, LastName, UserID, IsMobileVerified: result.recordset[0].IsMobileVerified, IsEmailVerified: result.recordset[0].IsEmailVerified, CompanyUserMasterID, UserType, CompanyID
                    }], message: "Authorized User"
                }, new ResponseModel()));

            }
            else {
                var errMessage = `The OTP you've entered is incorrect. Pleases try again.`;
                res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: errMessage }, new ResponseModel()));
            }
        })
        .catch(err => {
            var errMessage = `An error occurred during OTP Validation`;
            APIErrorLog(spNameOTPVerification, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

var BothPOSTGenerateOTP = (req, res, UserID) => {

    OTPGenerator()
        .then(otparray => {

            var date = CurrentDateTime();

            var model = {
                UserID: UserID,
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
                                    return res.status(200).send(new modelBuilder().buildModel({
                                        status: 200, data: {
                                            UserID,
                                            OTPinfo: output
                                        }, message: "OTP has been sent to your registered mobile number and email id"
                                    }, new ResponseModel()));
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

var POSTSameGenerateOTP = (req, res) => {

    SameOTPGenerator(req, res, {
        UserID: req.params.UserID
    }, 6, 8)
}

var DeviceLogin = async (req, res, obj) => {

    const { UserID, DeviceID } = await { ...obj }

    try {

        const model = await {
            UserID, DeviceID, Registered_Date: CurrentDateTime()
        }

        var inputparams = [];

        await Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        var Outputmodel = {
            Error_Message: null,
            isNewDeviceID: 0
        }

        var outputParams = [];

        await Object.keys(Outputmodel).forEach(element => {
            outputParams.push({
                "name": element,
                "type": sql.NVarChar,
                "value": model[element] ? model[element] : null
            })
        });

        const MasterData = await runStoredProcedureOutput(Check_DeviceID, inputparams, outputParams);
        const { Error_Message, isNewDeviceID } = await MasterData.output

        if (Error_Message) {
            return res.status(200).send(new modelBuilder().buildModel({ status: 401, error_code: 'UNAUTHORIZED', error: Error_Message }, new ResponseModel()));
        }

        if (isNewDeviceID == 0) {
            return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: MasterData.recordset[0], message: "You have been successfully logged in" }, new ResponseModel()));
        }

        BothPOSTGenerateOTP(req, res, UserID)

    } catch (err) {
        var errMessage = 'An error occurred during Check device ID'
        APIErrorLog(Check_DeviceID, err, req.headers, req.body, null, req.method, req.params, req.query);
        return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}
// registered Date

router.post('/api/login/verify', POSTLoginVerify);
router.post('/api/Forgot/Password', POSTForgotPassword);
router.put('/api/Forgot/Password/update', PUTForgotPassword);
router.post('/api/login/otp/verify', POSTLoginOTPVerify);
router.post('/api/single/generate/otp/:UserID', POSTSameGenerateOTP);

module.exports = router;