var router = require('express').Router();
var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery, runStoredProcedure, UpdateQuery, runStoredProcedureTblinput } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var PropertyMasterModel = require('../Model/PropertyMasterModel');
var PropertyModel = require('../Model/PropertyModel');
var PropertyOtherDetailsModel = require('../Model/PropertyOtherDetailsModel');

var CurrentDateTime = require('../shared/CurrentDateTime');

// heade function
var UserIDfromHeader = require('../shared/UserIDfromHeader');

var TableName = 'tbl_PropertyMaster';
var TableName2 = 'tbl_PropertyOtherDetails';
var TableName3 = 'tbl_PropertyInCharge';
var TableName4 = 'tbl_PropertyOwnership';
var spName = 'sp_POST_PropertyMaster';
var spName1 = 'sp_POST_PropertyInCharge_Ownership';
var ViewTable = 'view_PropertyandOtherDetails';
var ViewOwnerTable = 'vw_PropertyOwnerCSV';
var ViewInChargeTable = 'vw_PropertyInchargeCSV';

var GETProperty = (req, res) => {

    var MsSqlQuery = SqlString.format(`Select * from ${ViewTable}  where PropertyID = ?;
    Select * from ${TableName3} where PropertyID = ?;
    select * from ${TableName4} where PropertyID = ?;`, [req.params.PropertyID, req.params.PropertyID, req.params.PropertyID]);

    executeQuery(MsSqlQuery)
        .then(data => {
            var Property = {...data.recordsets[0][0], InCharge: data.recordsets[1], Ownership: data.recordsets[2] };
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: Property, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching Property List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

var POSTProperty = (req, res) => {
    try {
        var model = new modelBuilder().buildModel(req.body, new PropertyMasterModel());

        model.CreatedAt = CurrentDateTime();
        model.CreatedBy = +req.body.CreatedBy;
        model.IpAddress = req.myCustomAttributeName;
        model.TrustID = +req.body.TrustID;
        model.UserID = +model.UserID
        model.VillageID = +model.VillageID
        model.milkatno_propId = String(model.milkatno_propId)
        model.AgeOfProperty = +model.AgeOfProperty
            // console.log('model: ', model);
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
                PropertyInChargeandOwnerShip(req, res, result.recordset[0].PropertyID)
            })
            .catch(err => {
                console.log('err: ', err);
                var errMessage = `An error occurred during Adding Property List`;
                APIErrorLog(spName, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            })
    } catch (err) {
        console.log('err: ', err);
        var errMessage = `An error occurred during Adding Property List`;
        APIErrorLog(spName, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
    }


}

var PropertyInChargeandOwnerShip = (req, res, PropertyID) => {
    var InCharge = req.body.InCharge ? req.body.InCharge : [];
    var OwnerShip = req.body.OwnerShip ? req.body.OwnerShip : [];

    if (InCharge.length > 0 || OwnerShip.length > 0) {

        var temp_InCharge = new sql.Table();
        var temp_OwnerShip = new sql.Table();

        // Columns must correspond with type we have created in database.  
        temp_InCharge.columns.add('PropertyID', sql.BigInt);
        temp_InCharge.columns.add('InChargeName', sql.VarChar(255));
        temp_InCharge.columns.add('Designation', sql.VarChar(255))
        temp_InCharge.columns.add('InChargeType', sql.VarChar(255));
        temp_InCharge.columns.add('MobileNo', sql.BigInt);
        temp_InCharge.columns.add('Email', sql.VarChar(255));
        temp_InCharge.columns.add('Address', sql.VarChar(255));
        temp_InCharge.columns.add('InChargeFromDate', sql.VarChar(255));

        // Columns must correspond with type we have created in database.  
        temp_OwnerShip.columns.add('PropertyID', sql.BigInt);
        temp_OwnerShip.columns.add('OwnerName', sql.VarChar(255));
        temp_OwnerShip.columns.add('SinceFrom', sql.VarChar(255));

        // Add data into the table that will be pass into the procedure  
        for (var i = 0; i < InCharge.length; i++) {
            temp_InCharge.rows.add(PropertyID, InCharge[i].InChargeName, InCharge[i].Designation, InCharge[i].InChargeType, InCharge[i].MobileNo, InCharge[i].Email, InCharge[i].Address, InCharge[i].InChargeFromDate);

        }

        for (var i = 0; i < OwnerShip.length; i++) {
            temp_OwnerShip.rows.add(PropertyID, OwnerShip[i].OwnerName, OwnerShip[i].SinceFrom);
        }

        var inputparams = [];
        inputparams.push({
            name: 'temp_InCharge',
            value: temp_InCharge
        }, {
            name: 'temp_OwnerShip',
            value: temp_OwnerShip
        }, {
            name: 'PropertyID',
            value: PropertyID
        })


        runStoredProcedureTblinput(spName1, inputparams)
            .then(result => {

                res.status(200).send(new modelBuilder().buildModel({ status: 200, data: { PropertyID }, message: "Property Successfully Added" }, new ResponseModel()));
            })
            .catch(err => {
                console.log('err: ', err);
                var errMessage = `An error occurred during Processing Property In charge and Owner ship data`;
                APIErrorLog(spName1, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
            })

    } else {
        res.status(200).send(new modelBuilder().buildModel({ status: 200, data: { PropertyID }, message: "Property successfully Inserted" }, new ResponseModel()));
    }
}


var PUTProperty = (req, res) => {

    var model = new modelBuilder().buildModel(req.body, new PropertyModel());

    model.ModifiedAt = CurrentDateTime();

    UpdateQuery(TableName, model, req.params.PropertyID, 'PropertyID')
        .then(MsSqlQuery => {

            executeQuery(MsSqlQuery)
                .then(data => {

                    if (data.rowsAffected == 1) {
                        var model = new modelBuilder().buildModel(req.body, new PropertyOtherDetailsModel());

                        model.PropertyID = req.params.PropertyID;

                        UpdateQuery(TableName2, model, req.params.PropertyID, 'PropertyID')
                            .then(MsSqlQuery2 => {

                                executeQuery(MsSqlQuery2)
                                    .then(data2 => {

                                        PropertyInChargeandOwnerShip(req, res, req.params.PropertyID)
                                    })
                                    .catch(err => {
                                        console.log('err: ', err);
                                        var errMessage = `An error occurred during Updating Property Other Details Data`;
                                        APIErrorLog(MsSqlQuery2, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                                        res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                                    })

                            })
                            .catch(err => {
                                console.log('err: ', err);
                                var errMessage = err;
                                res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: 'NO_CONTENT', error: errMessage }, new ResponseModel()));
                            })
                    } else {
                        res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: 'Not_Found', message: "Records Not found" }, new ResponseModel()));
                    }

                })
                .catch(err => {
                    console.log('err: ', err);
                    var errMessage = `An error occurred during Updating Property Data`;
                    APIErrorLog('UpdateQuery', err, req.headers, req.body, errMessage, req.method, req.params, req.query);
                    res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
                })

        })
        .catch(err => {
            var errMessage = err;
            res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: 'NO_CONTENT', error: errMessage }, new ResponseModel()));
        })



}

var DELETEProperty = (req, res) => {

    var MsSqlQuery = SqlString.format(`Update ${TableName} set IsActive = 0 where PropertyID = ?`, [req.params.PropertyID]);

    executeQuery(MsSqlQuery)
        .then(data => {

            if (data.rowsAffected == 1) {
                res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.rowsAffected, message: "Records successfully Deleted" }, new ResponseModel()));
            } else {
                res.status(200).send(new modelBuilder().buildModel({ status: 404, error_code: 'Not_Found', message: "Records Not found" }, new ResponseModel()));
            }
        })
        .catch(err => {
            var errMessage = `An error occurred during Deleting Property Data`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'Not_Found', error: errMessage }, new ResponseModel()));
        })

}

var GETPropertyListByState = (req, res) => {

    var MsSqlQuery = SqlString.format(`Select * from ${ViewTable}  where CreatedBy = ? AND StateID = ? order by PropertyID desc;Select * from ${ViewOwnerTable}
    where PropertyID IN (Select PropertyID from ${TableName} where CreatedBy = ? AND stateID = ?);Select * from ${ViewInChargeTable} where PropertyID IN 
    (Select PropertyID from ${TableName} where CreatedBy = ? AND stateID = ?)`, [req.params.UserId, req.params.StateID, req.params.UserId, req.params.StateID, req.params.UserId, req.params.StateID]);
    // var MsSqlQuery = SqlString.format(`Select * from ${ViewTable}  where StateID = ? order by PropertyID desc;Select * from ${ViewOwnerTable}
    // where PropertyID IN (Select PropertyID from ${TableName} where stateID = ?);Select * from ${ViewInChargeTable} where PropertyID IN (Select PropertyID from ${TableName} where stateID = ?)`, [req.params.StateID, req.params.StateID, req.params.StateID]);

    executeQuery(MsSqlQuery)
        .then(data => {
            var PropertyData = data.recordsets[0];
            var OwnerData = data.recordsets[1];
            var InChargeData = data.recordsets[2];

            var PropertyOwnerShipData = []

            PropertyData.forEach((element => {
                PropertyOwnerShipData.push({
                    ...element,
                    PropertyOwner: OwnerData.filter(e => e.PropertyID === element.PropertyID).length === 0 ? null : ((OwnerData.filter(e => e.PropertyID === element.PropertyID))[0].PropertyOwnerShip).trim(),
                    PropertyIncharge: InChargeData.filter(e => e.PropertyID === element.PropertyID).length === 0 ? null : ((InChargeData.filter(e => e.PropertyID === element.PropertyID))[0].PropertyInCharge).trim()
                })
            }))
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: PropertyOwnerShipData, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {

            var errMessage = `An error occurred during Fetching Property List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

var GETPropertyStateWiseCounts = (req, res) => {
    // UserIDfromHeader(req, res)
    //     .then((CreatedBy) => {
    var MsSqlQuery = SqlString.format(`Select M.StateID as StateID ,count(PropertyId) as NoOfProperty ,S.StateName 
        from (Select * from tbl_propertymaster where CreatedBy IS NOT NULL AND CreatedBy = ?) M  inner join tblState
        S on M.StateID=S.StateID where M.IsActive = 1group by M.StateID,S.StateName`, [req.params.UserId]);
    // var MsSqlQuery = SqlString.format(`Select M.StateID as StateID ,count(PropertyId) as NoOfProperty ,S.StateName 
    //         from (Select * from tbl_propertymaster) M  inner join tblState S on M.StateID=S.StateID where M.IsActive = 1
    //         group by M.StateID,S.StateName`);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching State List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
        // })
}

var GETPropertyAllStateWiseCounts = (req, res) => {
    var MsSqlQuery = SqlString.format(`Select M.StateID as StateID ,count(PropertyId) as NoOfProperty ,S.StateName 
        from (Select * from tbl_propertymaster where CreatedBy IS NOT NULL) M  inner join tblState
        S on M.StateID=S.StateID where M.IsActive = 1group by M.StateID,S.StateName`, [req.params.userid]);

    executeQuery(MsSqlQuery)
        .then(data => {
            res.status(200).send(new modelBuilder().buildModel({ status: 200, data: data.recordset, message: "data successfully Fetched" }, new ResponseModel()));
        })
        .catch(err => {
            var errMessage = `An error occurred during Fetching State List`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

router.get('/api/property/list', GETPropertyAllStateWiseCounts);
router.post('/api/property/add', POSTProperty);
router.get('/api/property/list/:UserId', GETPropertyStateWiseCounts);
router.get('/api/property/list/:UserId/:StateID', GETPropertyListByState);

router.get('/api/property/view/:PropertyID', GETProperty);
router.put('/api/property/update/:PropertyID', PUTProperty);
router.delete('/api/property/delete/:PropertyID', DELETEProperty);

module.exports = router;