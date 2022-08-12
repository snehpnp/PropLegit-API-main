var SqlString = require('sqlstring');
const sql = require('mssql');

const { executeQuery, runStoredProcedure } = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText');

const CurrentDateTime = require('./CurrentDateTime');
const GenrateAndStordRentInvoice = require('../PdfTemplate/RentInvoiceDocument');

const tblRent = 'tbl_PropertyRent';
const Generate_Rent_Invoice = 'sp_POST_Generate_Rent_Invoice'

var GenerateRentInvoice = (PropertyRentID) => {

    return new Promise(async (resolve, reject) => {


        const model = await {
            PropertyRentID,
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

        try {

            const MasterData = await runStoredProcedure(Generate_Rent_Invoice, inputparams);
            const InvoiceData = await MasterData.recordset[0];
            const ALLPaidMonths = await MasterData.recordsets[1];

            const DocumentMaster = await GenrateAndStordRentInvoice(InvoiceData, ALLPaidMonths);
            const { DocumentID } = await { ...DocumentMaster }

            const MsSqlQuery = await SqlString.format(`Update ${tblRent} SET InvoiceDocumentID = ? WHERE PropertyRentID = ?`, [DocumentID, PropertyRentID]);

            try {

                const InvoiceData = await executeQuery(MsSqlQuery);

                resolve(DocumentMaster);

            } catch (err) {
                var errMessage = `An error occurred during Update Invoice ID for Rent ${PropertyRentID}`;
                APIErrorLog(MsSqlQuery, err, null, null, errMessage, null, null, null);
                reject(err);
            }

        } catch (err) {
            var errMessage = `An error occurred during Genrate Invoice for Rent ${PropertyRentID}`;
            APIErrorLog(Generate_Rent_Invoice, err, null, null, errMessage, null, null, null);
            reject(err);

        }

    })
}

module.exports = GenerateRentInvoice