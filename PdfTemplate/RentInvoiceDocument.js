const GetEmailAttachmentBuffer = require('../shared/GetEmailAttachmentBuffer');
const { MssqldatetimeFormat, CurrentdatetimeFormat } = require('../shared/datetimeFormat');
const CurrentDateTime = require('../shared/CurrentDateTime');
const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');

var converter = require('number-to-words');

// Sql DB info
const PDFEmailAttachmentID = 1;
const DocumentTypeIDForRent = 2;
const DocumentRentSubTypeIdForInvoice = 20;

var GenrateAndStordRentInvoice = (objmy, ALLPaidMonths) => {

    return new Promise(async (resolve, reject) => {
        try {

            const { SGST, CGST, IGST, TotalDueAmount, RentAmount } = await { ...objmy };
            const SGSTPer = await SGST;
            const CGSTPer = await CGST;
            const IGSTPer = await IGST;

            const everymonthTaxCal = () => {

                return new Promise(async (resolve, reject) => {

                    if (ALLPaidMonths && ALLPaidMonths.length < 1) resolve([]);

                    var i = [];

                    ALLPaidMonths.forEach(async (element, index) => {

                        element.ID = index
                        element.DueAmount = await ((element.DueAmount) / (1 + (SGSTPer + CGSTPer + IGSTPer) / 100)).toFixed(2);
                        element.RentStartMonthORDate = await MssqldatetimeFormat(element.RentStartMonthORDate, 'DD-MMMM-YYYY');
                        element.RentEndMonthORDate = await MssqldatetimeFormat(element.RentEndMonthORDate, 'DD-MMMM-YYYY')

                        i.push(element);

                        if (i.length === ALLPaidMonths.length) resolve(ALLPaidMonths.sort((a, b) => a.ID < b.ID));

                    });

                })

            }

            const everymonths = await everymonthTaxCal();

            const GradTotal = await TotalDueAmount;
            const GradTotalWithoutTax = await GradTotal / (1 + (SGSTPer + CGSTPer + IGSTPer) / 100);
            const SGSTAmount = await (GradTotalWithoutTax * (SGSTPer / 100)).toFixed(2);
            const CGSTAmount = await (GradTotalWithoutTax * (CGSTPer / 100)).toFixed(2);
            const IGSTAmount = await (GradTotalWithoutTax * (IGSTPer / 100)).toFixed(2);


            var dataoject = await {
                TenantName: objmy.TenantName,
                TenantAddress: objmy.TenantAddress,
                TenantEmail: objmy.TenantEmail,
                InvoiceDate: MssqldatetimeFormat(objmy.InvoiceDate, 'DD/MM/YYYY'),
                InvoiceID: objmy.InvoiceID,
                PropertyName: objmy.PropertyName,
                RentStartMonthORDate: MssqldatetimeFormat(objmy.RentStartMonthORDate, 'MM/YYYY'),
                RentEndMonthORDate: MssqldatetimeFormat(objmy.RentEndMonthORDate, 'MM/YYYY'),
                SGSTPer,
                SGSTAmount,
                CGSTPer,
                CGSTAmount,
                IGSTPer,
                IGSTAmount,
                RentAmount,
                Cheque_Favour_OF: objmy.Cheque_Favour_OF,
                GSTNumber: objmy.GSTNumber,
                IFSCCODE: objmy.IFSCCODE,
                MICRCODE: objmy.MICRCODE,
                DueAmount: 0,
                AccessAmount: 0,
                CompanyAddress: objmy.CompanyAddress,
                TransactionSMSMobileNo: objmy.TransactionSMSMobileNo,
                TotalDueAmount: objmy.TotalDueAmount.toFixed(2),
                TotalDueAmountInWord: converter.toWords(objmy.TotalDueAmount).replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
                // AmountPayInWord: converter.toWords(objmy.AmountPay),
                BankAccountName: objmy.BankAccountName,
                BankAccountNumber: objmy.BankAccountNumber,
                ModeOfPayment: objmy.ModeOfPayment,
                PaymentDate: MssqldatetimeFormat(objmy.PaymentDate, 'MMMM Do YYYY'),
                ChequeNo: objmy.ChequeNo,
                BankName: objmy.BankName,
                BankBranchName: objmy.BankBranchName,
                TransactionID: objmy.TransactionID,
                WalletName: objmy.WalletName,
                everymonths
            }

            var pdfBuffer = await GetEmailAttachmentBuffer(dataoject, PDFEmailAttachmentID);

            const { PropertyID, PropertyTenantID, PropertyRentID, ModifiedBy } = await { ...objmy }

            var model = await {
                PropertyID,
                DocumentTypeId: DocumentTypeIDForRent,
                DocumentSubTypeId: DocumentRentSubTypeIdForInvoice,
                Subdirectory: `Tenant-${PropertyTenantID}`,
                FileExistenceCheck: 0,
                IpAddress: null,
                FileName: `Invoice_${PropertyRentID}.PDF`,
                FileType: 'PDF',
                Description: 'Auto genrated Rent Invoice',
                UserID: ModifiedBy,
                CreatedBy: ModifiedBy
            }

            var response = await SaveDocumentGetDocumentID(model, { buffer: pdfBuffer })

            resolve(response);
        } catch (err) {
            reject(err)
        }
    })
}

module.exports = GenrateAndStordRentInvoice;