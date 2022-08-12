let ejs = require("ejs");
var html_to_pdf = require('html-pdf-node');

const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var TableName = 'tbl_EmailAttachmentTemplates';

var GetEmailAttachmentBuffer = (object, AttachmentID) => {

    return new Promise(async (resolve, reject) => {

        try {
            var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE AttachmentID = ${AttachmentID}`);
            let queryData = await executeQuery(MsSqlQuery);
            var template = queryData.recordset[0];

            if (!template) return reject('Template Not Found!!')

            const html = await ejs.render(template.AttachmentTemplate, object, { async: true });

            let file = { content: html };
            let options = { format: 'A4' };
            let pdfBuffer = await html_to_pdf.generatePdf(file, options);

            resolve(pdfBuffer);

        } catch (err) {
            reject(err)
        }
    })

}

module.exports = GetEmailAttachmentBuffer;