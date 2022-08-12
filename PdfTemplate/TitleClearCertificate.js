let ejs = require("ejs");
var html_to_pdf = require('html-pdf-node');

const { executeQuery } = require('../MsSql/Query');
var SqlString = require('sqlstring');

var TableName = 'tbl_EmailAttachmentTemplates';
const AttachmentID = 3;

var getTitleClearCertificateTemplateRecord = async () => {
    var MsSqlQuery = SqlString.format(`Select * from ${TableName} WHERE AttachmentID = ${AttachmentID}`);
    let queryData = await executeQuery(MsSqlQuery);
    return queryData.recordset[0];
}

var makeTitleClearCertificatePdf = async (templateRecord, TitleClearCertiData) => {

    const html = await ejs.render(templateRecord.AttachmentTemplate, { data: TitleClearCertiData }, { async: true });

    let options = { format: 'A4' };
    let file = { content: html };
    let pdfBuffer = await html_to_pdf.generatePdf(file, options);
    return pdfBuffer;
}

module.exports = {
    getTitleClearCertificateTemplateRecord,
    makeTitleClearCertificatePdf
}

