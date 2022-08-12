const sql = require('mssql')

const { runStoredProcedure } = require('../MsSql/Query');
const { UploadFile, checkFile } = require('../shared/S3Bucket');

var modelBuilder = require('../helpers/modelBuilder');
var PropertyDocumentFileModel = require('../Model/PropertyDocumentFileModel');

var CurrentDateTime = require('../shared/CurrentDateTime');

var spNamePropertyDocument = 'sp_POST_PropertyDocument';

var SaveDocumentGetDocumentID = async (modelData, file) => {

    return new Promise(async (resolve, reject) => {

        try {

            var { PropertyID, DocumentTypeId, FileExistenceCheck, FileName, Subdirectory, TrustID } = await modelData;

            var FilePathID = PropertyID ? PropertyID : TrustID;

            var data = await checkFile(FilePathID, DocumentTypeId, FileName, Subdirectory);

            if (data.code !== 'NotFound' && FileExistenceCheck == 1) {
                resolve({
                    FileExistence: true,
                    errMessage: `File already exists do you want to overwrite?`
                })
            }

            var result = await UploadFile(file, FilePathID, DocumentTypeId, FileName, Subdirectory);
            var model = await new modelBuilder().buildModel(modelData, new PropertyDocumentFileModel());

            model.FileURL = result.Location;
            model.Key = result.Key;
            model.S3BucketName = result.Bucket;
            model.CreatedAt = CurrentDateTime();

            var inputparams = [];

            await Object.keys(model).forEach(element => {
                inputparams.push({
                    "name": element,
                    "type": sql.NVarChar,
                    "value": model[element] ? model[element] : null
                })
            });

            var DocumentResult = await runStoredProcedure(spNamePropertyDocument, inputparams)

            resolve(DocumentResult.recordset[0]);

        } catch (err) {

            reject(err);
        }
    })
}

module.exports = SaveDocumentGetDocumentID