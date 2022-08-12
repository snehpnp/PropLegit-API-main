var router = require('express').Router();
var SqlString = require('sqlstring');

const multer = require('multer');
const { UploadFileByFileNameOnly, checkFileByFileNameOnly } = require('../shared/S3Bucket');

const upload = multer()

const { executeQuery } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');

var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');
var CompanyMasterModel = require('../Model/CompanyMasterModel');

var CurrentDateTime = require('../shared/CurrentDateTime');

var tblCompany = 'tblCompany_Master';

var POSTCompany = (req, res) => {

    if (!req.file) {
        AddCompany(req, res)
    }
    else {
        checkFileByFileNameOnly(`Company/Logo/${req.body.FileName}`)
            .then(data => {

                if (data.code !== 'NotFound' && req.query.FileExistenceCheck == 1) {
                    var errMessage = `File already exists do you want to overwrite?`;
                    return res.status(200).send(new modelBuilder().buildModel({ status: 403, error_code: 'ALREADY_EXISTS', error: errMessage }, new ResponseModel()));
                }

                UploadFileByFileNameOnly(req.file, `Company/Logo/${req.body.FileName}`)
                    .then(uploadResult => {

                        AddCompany(req, res, uploadResult.Location)
                    })
                    .catch(err => {
                        var errMessage = `An error occurred  during Uploading company Logo`;
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


}

var AddCompany = (req, res, LogoURL = null) => {
    var model = new CompanyMasterModel(req.body.CompanyName, req.body.CompanyDescription, LogoURL)

    model.IpAddress = req.myCustomAttributeName;
    model.CreatedAt = CurrentDateTime();
    model.CreatedBy = req.body.CreatedBy;

    var MsSqlQuery = SqlString.format(`insert into ${tblCompany} (CompanyName, CompanyDescription, CompanyLogo, IpAddress, CreatedAt, CreatedBy) output Inserted.CompanyID VALUES(?, ?, ?, ?, ?, ?)`, [model.CompanyName, model.CompanyDescription, model.CompanyLogo, model.IpAddress, model.CreatedAt, model.CreatedBy])

    executeQuery(MsSqlQuery)
        .then(addResult => {

            return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: addResult.recordset, message: "Company Data Successfully Uploaded" }, new ResponseModel()));

        })
        .catch(err => {
            var errMessage = `An error occurred during Company Add`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })

}

var GETCompany = (req, res) => {
    var MsSqlQuery = SqlString.format(`Select * from  ${tblCompany} order by CompanyID desc`)

    executeQuery(MsSqlQuery)
        .then(addResult => {

            return res.status(200).send(new modelBuilder().buildModel({ status: 200, data: addResult.recordset, message: "Company Data Successfully Uploaded" }, new ResponseModel()));

        })
        .catch(err => {
            var errMessage = `An error occurred during Company list`;
            APIErrorLog(MsSqlQuery, err, req.headers, req.body, errMessage, req.method, req.params, req.query);
            return res.status(500).send(new modelBuilder().buildModel({ status: 500, error_code: 'SERVER_ERROR', error: errMessage }, new ResponseModel()));
        })
}

router.post('/api/Company/new', upload.single('uploadfile'), POSTCompany);
router.get('/api/Company/list', GETCompany)

module.exports = router;