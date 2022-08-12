var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { runStoredProcedureTblinput, executeQuery, runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');
const WelcomeTrustEmail = require('../EmailTemplate/WelcomeTrustEmail');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
const TrustMasterModel = require('../Model/TrustMasterModel');
const CurrentDateTime = require('../shared/CurrentDateTime');
const EmailCommonReminder = require('../EmailTemplate/EmailCommonTrustReminder');
const { PasswordGenerator } = require('../shared/RendomPasswordGanerator');
const { GeneratePassword } = require('../shared/Password');
const SMSForReminder = require('../SMSTemplate/CommonSMSTrustReminder');
const Vw_TrustMaster = 'view_TrustMaster';
const tbl_TrusteeUsers = 'TrusteeUsers';
const tblTrusteeUserType = `TrusteeUserType`;
const spTrustMaster = 'sp_POST_TrustMaster';
const tbl_TrustProperties = 'TrustProperties';
const sp_Trust_Property = 'sp_POST_Trust_Property'
const sp_trustee = 'sp_POST_Trust_Trustee'
const sp_trusteeEdit = `sp_Edit_Trustee`
var GETTrusteeUserType = async(req, res) => {

    var MsSqlQuery = await SqlString.format(`SELECT TrusteeUsertypeID, TrusteeUsertype FROM ${tblTrusteeUserType}`);

    try {

        const Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: Result.recordset, message: "data successfully Fetched" }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching trust user type`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}

var GETTrusteeView = async(req, res) => {

    var { TrustID } = {...req.params };
    TrustID = +TrustID

    if (!TrustID) {
        var errMessage = `please pass numeric values for TrustID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }


    var MsSqlQuery = await SqlString.format(`SELECT * FROM ${Vw_TrustMaster} where TrustID = ?;
    SELECT count(PropertyID) as PropertyCount FROM ${tbl_TrustProperties} where TrustID = ?  AND
         isDelete = 0 AND AttachedWithTrust = 1;
     Select u.*, t.TrusteeUsertype from ${tbl_TrusteeUsers}  u left join TrusteeUserType t
on t.TrusteeUsertypeID = u.TrusteeUsertypeID where TrustID = ? and IsDelete = 0 ; `, [TrustID, TrustID, TrustID]);

    try {

        const Result = await executeQuery(MsSqlQuery);
        const MasterData = await Result.recordsets;
        const t_Details = MasterData[0];
        const t_Propertys = MasterData[1];
        const t_Users = MasterData[2];

        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: {
                ...t_Details[0],
                ...t_Propertys[0],
                TrusteeUsers: t_Users
            },
            message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching trust Details with trustee`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}

var POSTAddTrust = async(req, res) => {

    const { TrusteeUsers, CreatedBy } = await {...req.body };
    // var mssqlQuery = SqlString.format(`select Count(*) as Count tbl_PropertyTrustMaster where 
    // TrustEmailId='${TrustEmailId}' OR TrustPhoneNo='${TrustPhoneNo}'`)
    try {
        //    const run = await executeQuery(mssqlQuery)
        //   if(run.recordset[0].count > 0){
        //     var errMessage = `Email And Password Already Exists!!!`;
        //     return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        //   }

        var model = new modelBuilder().buildModel(req.body, new TrustMasterModel());
        model.IpAddress = req.myCustomAttributeName;
        model.CreatedAt = CurrentDateTime();
        model.CreatedBy = CreatedBy;

        var temp_User = new sql.Table();

        // Columns must correspond with type we have created in database.  
        temp_User.columns.add("TrusteeUsertypeID", sql.Int);
        temp_User.columns.add("Name", sql.VarChar(100));
        temp_User.columns.add("Mobile", sql.VarChar(50));
        temp_User.columns.add("Email", sql.VarChar(225));
        temp_User.columns.add("Address", sql.VarChar(225));
        temp_User.columns.add("StartDate", sql.VarChar(225));

        // Add data into the table that will be pass into the procedure  

        for (var i = 0; i < TrusteeUsers.length; i++) {
            var { TrusteeUsertypeID, Name, Mobile, Email, Address, StartDate } = {...TrusteeUsers[i] }
            temp_User.rows.add(TrusteeUsertypeID, Name, Mobile, Email, Address, StartDate);
        }

        model.TrusteeUsers_temp = temp_User;

        var inputparams = [];

        Object.keys(model).forEach(element => {
            inputparams.push({
                "name": element,
                "value": model[element] ? model[element] : null
            })
        });


        const MasterResult = await runStoredProcedureTblinput(spTrustMaster, inputparams);
        const MasteDate = await MasterResult.recordsets;
        const idDetails = await MasteDate[0];
        const T_Users = await MasteDate[1];
        const Email_Template = await MasteDate[2];
        const getLawyer = await MasteDate[3];
        // console.log('getLawyer: ', getLawyer);
        if (getLawyer.length > 0) {
            console.log('in')
            await Promise.all(getLawyer.map(async x => {
                const sendemaitolawyer = await sendToLawyer(x)
                return;
            }))

        }
        console.log('getLawyer');
        if (T_Users.length > 0) {
            const emailResult = await WelcomeTrustEmail(T_Users, Email_Template[0])
        }


        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: idDetails, message: "Trust Successfully Added!!!" }, new ResponseModel()));

    } catch (err) {
        console.log('err: ', err);
        var errMessage = `An error occurred during Insert Trust and TrusteeUsers Data`;
        APIErrorLog(spTrustMaster, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}
var sendToLawyer = (data) => {
    return new Promise(async(resolve, reject) => {
        const query = await SqlString.format(`SELECT * FROM  tbl_Templates where TemplateID in (47,4)`);
        try {
            const run = await executeQuery(query)
            const record = await run.recordsets
            var password = await PasswordGenerator();
            // console.log('password: ', password);
            const object = await Object.assign({ Password: password }, { Name: data.FirstName, Email: data.EmailAddress, Mobile: data.MobileNumber })
            const email = await EmailCommonReminder(object, record[0][1])
            const sms = await SMSForReminder(record[0][0], object)
            const hashPassword = await GeneratePassword(password)
            const updatePasswordquery = await SqlString.format(`UPDATE tbl_usermaster SET password = '${hashPassword}' where EmailAddress = '${data.EmailAddress}';`);
            const runupdate = await executeQuery(updatePasswordquery);
            resolve(runupdate);
        } catch (error) {
            reject(error)
        }
    })
}
var GETTrustListByUserID = async(req, res) => {

    var { UserID } = {...req.params };
    UserID = +UserID

    if (!UserID) {
        var errMessage = `please pass numeric values for UserID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }


    var MsSqlQuery = await SqlString.format(`SELECT * FROM ${Vw_TrustMaster} where CreatedBy = ? ORDER BY CreatedAt DESC ;
   `, [UserID]);

    try {

        const Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: Result.recordset,
            message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching trust Details by UserID`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}

var GETTrustPropertyList = async(req, res) => {

    var { TrustID } = {...req.params };
    TrustID = +TrustID

    if (!TrustID) {
        var errMessage = `please pass numeric values for TrustID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }


    var MsSqlQuery = await SqlString.format(`Select * from view_PropertyandOtherDetails
    where PropertyID in (Select PropertyID from TrustProperties where TrustID = ? AND
         isDelete = 0 AND AttachedWithTrust = 1) ORDER BY CreatedAt DESC`, [TrustID]);

    try {

        const Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: Result.recordset,
            message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching trust Details with trustee`;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}


var GETTrustPropertySelect = async(req, res) => {

    var MsSqlQuery = await SqlString.format(`Select * from view_PropertyandOtherDetails
    where PropertyID  not in (Select PropertyID from TrustProperties
         WHERE isDelete = 0 AND AttachedWithTrust = 1)`);

    try {

        const Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: Result.recordset,
            message: "data successfully Fetched"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during Fetching select Property for Trust `;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}

var POSTTrustProperty = async(req, res) => {

    const { TrustID, PropertyID, CreatedBy } = await {...req.body };

    if (!+TrustID || !+PropertyID || !+CreatedBy || TrustID < 1 || PropertyID < 1 || CreatedBy < 1) {
        var errMessage = `please pass numeric values for TrustID, PropertyID and CreatedBy value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage, message: errMessage }, new ResponseModel()));
    }

    var model = {
        TrustID,
        PropertyID,
        CreatedBy,
        IpAddress: req.myCustomAttributeName,
        CreatedAt: CurrentDateTime(),
    }

    var inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {

        const ResultData = await runStoredProcedure(sp_Trust_Property, inputparams);
        const MasterData = ResultData.recordset;
        const resData = MasterData[0];
        const { Error } = {...resData }

        if (Error) {
            var errMessage = Error;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage, message: errMessage }, new ResponseModel()));
        }

        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: ResultData.recordset, message: "Property Successfully Add into Trust!!" }, new ResponseModel()));


    } catch (err) {
        var errMessage = `An error occurred during Insert Trust Property Data`;
        APIErrorLog(sp_Trust_Property, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}


var DELETETrustProperty = async(req, res) => {

    const { TrustID, PropertyID } = await {...req.params };

    if (!+TrustID || !+PropertyID || +TrustID < 1 || +PropertyID < 1) {
        var errMessage = `please pass numeric values for TrustID, PropertyID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }

    var MsSqlQuery = await SqlString.format(`Update TrustProperties
    SET isDelete = 1, AttachedWithTrust = 0
    WHERE PropertyID = ? and TrustID = ?`, [PropertyID, TrustID]);

    try {

        const Result = await executeQuery(MsSqlQuery);

        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: [],
            message: "Property successfully Remove From Trust!!"
        }, new ResponseModel()));

    } catch (err) {
        var errMessage = `An error occurred during remove Property form Trust `;
        APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}

var EDITtrusteeUSER = async(req, res) => {
    var { TrusteeUserID } = await {...req.params };
    var { Name, Mobile, Email, IsDelete, Address, TrustID, TrusteeUsertypeID, StartDate, endDate } = await {...req.body }
    TrusteeUserID = +TrusteeUserID
    var UserType = ''
    if (TrusteeUsertypeID == 1) {
        UserType = 'Manager'
    } else if (TrusteeUsertypeID == 2) {
        UserType = 'CA-Auditor'
    } else if (TrusteeUsertypeID == 3) {
        UserType = 'Trustee'
    } else if (TrusteeUsertypeID == 4) {
        UserType = 'Lawyer'
    }
    if (!TrusteeUserID) {
        var errMessage = `please pass numeric values for TrusteeUserID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }
    var model = await { Name, Mobile, Email, Address, TrustID, TrusteeUsertypeID, StartDate, TrusteeUserID, endDate, IsDelete }
    var inputparams = [];
    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "type": sql.NVarChar,
            "value": model[element] ? model[element] : null
        })
    });

    try {
        const check = await runStoredProcedure(sp_trusteeEdit, inputparams);
        console.log('check: ', check.recordsets[0].EmailFlag == 'sendToAlready', check.recordsets[0]);
        if (check.recordset[0].error) {
            var errMessage = `${check.recordset[0].error}!!!`;
            return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
        }
        if (check.recordset[0].true) {
            res.status(200).send(new modelBuilder().buildModel({
                status: 200,
                data: {
                    TrusteeUserID: TrusteeUserID
                },
                message: `${UserType} Detail Updated`
            }, new ResponseModel()));

        } else {
            if (check.recordsets[0][0].EmailFlag == 'sendToAlready') {
                const emailResult = await WelcomeTrustEmail(check.recordsets[0], check.recordsets[1][0])
            }
            if (check.recordsets[0][0].EmailFlag == 'sendTonewUser') {
                const emailResult = await WelcomeTrustEmail(check.recordsets[0], check.recordsets[1][0])
                const sendemaitolawyer = await sendToLawyer(check.recordsets[0][0])
            }
            // const Result = await executeQuery(MsSqlQuery);
            res.status(200).send(new modelBuilder().buildModel({
                status: 200,
                data: {
                    TrusteeUserID: TrusteeUserID
                },
                message: `${UserType} Detail Updated`
            }, new ResponseModel()));
        }

    } catch (err) {
        console.log('err: ', err);
        var errMessage = `An error occurred during Trustee edit`;
        APIErrorLog(sp_trusteeEdit, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}
var EDITtrust = async(req, res) => {
    var { TrustID } = {...req.params };
    var { RegistrationORNondhniNo, TrustAddress, TrustEmailId, TrustPhoneNo, RegistrationDate, ProcessAppointmentTrustee } = await {...req.body }
    TrustID = +TrustID
    if (!TrustID) {
        var errMessage = `please pass numeric values for TrustID value!!!`;
        return res.status(200).send(new modelBuilder().buildModel({ status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage }, new ResponseModel()));
    }
    var modal = { RegistrationORNondhniNo, TrustAddress, TrustEmailId, TrustPhoneNo, RegistrationDate }
    var mssqlQuery = SqlString.format(`UPDATE tbl_PropertyTrustMaster 
    SET RegistrationORNondhniNo='${RegistrationORNondhniNo}',TrustAddress='${TrustAddress}',
    TrustEmailId='${TrustEmailId}',TrustPhoneNo='${TrustPhoneNo}',RegistrationDate='${RegistrationDate}',ProcessAppointmentTrustee='${ProcessAppointmentTrustee}'
    where TrustID = ${TrustID}`)
    try {
        const result = await executeQuery(mssqlQuery)
        res.status(200).send(new modelBuilder().buildModel({
            status: 200,
            data: {
                TrustID: TrustID

            },
            message: "Trust Basic Detail Updated"
        }, new ResponseModel()));
    } catch (err) {
        console.log('err: ', err);
        var errMessage = `An error occurred during edit Trust `;
        APIErrorLog(mssqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()))
    }

}
var AddTrusTee = async(req, res) => {
    var { TrusteeArray, CreatedBy } = {...req.body }
    var { TrustID } = {...req.params }
    var temp_User = new sql.Table();
    var model = {}
        // Columns must correspond with type we have created in database.  
    temp_User.columns.add("TrusteeUsertypeID", sql.Int);
    temp_User.columns.add("Name", sql.VarChar(100));
    temp_User.columns.add("Mobile", sql.VarChar(50));
    temp_User.columns.add("Email", sql.VarChar(225));
    temp_User.columns.add("Address", sql.VarChar(225));
    temp_User.columns.add("StartDate", sql.VarChar(225));

    // Add data into the table that will be pass into the procedure  

    for (var i = 0; i < TrusteeArray.length; i++) {
        var { TrusteeUsertypeID, Name, Mobile, Email, Address, StartDate } = {...TrusteeArray[i] }
        temp_User.rows.add(TrusteeUsertypeID, Name, Mobile, Email, Address, StartDate);
    }
    model.IpAddress = req.myCustomAttributeName;
    model.CreatedAt = CurrentDateTime();
    model.TrusteeUsers_temp = temp_User;
    model.CreatedBy = CreatedBy;
    model.TrustId = TrustID
    var inputparams = [];

    Object.keys(model).forEach(element => {
        inputparams.push({
            "name": element,
            "value": model[element] ? model[element] : null
        })
    });
    try {
        const MasterResult = await runStoredProcedureTblinput(sp_trustee, inputparams);
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: [], message: "Trustee Successfully Added!!!" }, new ResponseModel()));
    } catch (err) {
        console.log('err: ', err);
        var errMessage = `An error occurred during Insert  TrusteeUsers Data`;
        APIErrorLog(spTrustMaster, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }
}
router.get('/api/trust/user/type', GETTrusteeUserType);
router.post('/api/trust/add', POSTAddTrust);
router.get('/api/trust/view/:TrustID', GETTrusteeView);
router.get('/api/trust/list/:UserID', GETTrustListByUserID);
router.post('/api/trust/user/:TrusteeUserID', EDITtrusteeUSER)
router.post('/api/trust/edit/:TrustID', EDITtrust)
router.get('/api/trust/property/view/:TrustID', GETTrustPropertyList);
router.get('/api/trust/property/select', GETTrustPropertySelect);
router.post('/api/trust/trustee/add/:TrustID', AddTrusTee)
router.post('/api/trust/property/add', POSTTrustProperty);
router.delete('/api/trust/property/remove/:TrustID/:PropertyID', DELETETrustProperty);

module.exports = router;