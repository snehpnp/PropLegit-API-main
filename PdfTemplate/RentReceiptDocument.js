const GetEmailAttachmentBuffer = require('../shared/GetEmailAttachmentBuffer');
const { MssqldatetimeFormat, CurrentdatetimeFormat } = require('../shared/datetimeFormat');
const CurrentDateTime = require('../shared/CurrentDateTime');
const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');

var converter = require('number-to-words');

// Sql DB info
const PDFEmailAttachmentID = 2;
const DocumentTypeIDForRent = 2;
const DocumentRentSubTypeIdForReceipt = 21;

var GenrateAndStordRentReceipt = (objmy, ALLPaidMonths) => {

    return new Promise(async (resolve, reject) => {
        try {

            const { SGST, CGST, IGST, AmountFromAdvance, AmountPay, RentAmount } = await { ...objmy };
            const SGSTPer = await SGST;
            const CGSTPer = await CGST;
            const IGSTPer = await IGST;

            const everymonthTaxCal = () => {

                return new Promise(async (resolve, reject) => {

                    if (ALLPaidMonths.length < 1) resolve([]);

                    var i = [];

                    ALLPaidMonths.forEach(async (element) => {

                        element.MonthPaidAmount = await ((element.MonthPaidAmount) / (1 + (SGSTPer + CGSTPer + IGSTPer) / 100)).toFixed(2);
                        element.RentStartMonthORDate = await MssqldatetimeFormat(element.RentStartMonthORDate, 'DD-MMMM-YYYY');
                        element.RentEndMonthORDate = await MssqldatetimeFormat(element.RentEndMonthORDate, 'DD-MMMM-YYYY')

                        i.push(element);

                        if (i.length === ALLPaidMonths.length) resolve(ALLPaidMonths.sort((a, b) => a.ID < b.ID));

                    });

                })

            }

            const everymonths = await everymonthTaxCal();

            const GradTotal = await AmountFromAdvance + AmountPay;
            const GradTotalWithoutTax = await GradTotal / (1 + (SGSTPer + CGSTPer + IGSTPer) / 100);
            const SGSTAmount = await (GradTotalWithoutTax * (SGSTPer / 100)).toFixed(2);
            const CGSTAmount = await (GradTotalWithoutTax * (CGSTPer / 100)).toFixed(2);
            const IGSTAmount = await (GradTotalWithoutTax * (IGSTPer / 100)).toFixed(2);

            objmy.AmountPay = await Math.abs(objmy.AmountPay - objmy.TotalAccessAmount);

            var dataoject = await {
                TenantName: objmy.TenantName,
                TenantAddress: objmy.TenantAddress,
                ReceiptDate: CurrentdatetimeFormat(CurrentDateTime(), 'MMMM DD YYYY'),
                ReceiptNo: `RE-${CurrentdatetimeFormat(CurrentDateTime(), 'YYYY')}-${objmy.PropertyRentID}`,
                PropertyName: objmy.PropertyName,
                RentStartMonthORDate: MssqldatetimeFormat(objmy.RentStartMonthORDate, 'MM/YYYY'),
                RentEndMonthORDate: MssqldatetimeFormat(objmy.RentEndMonthORDate, 'MM/YYYY'),
                MonthlyORDailyRentWithOutTax: null,
                SGSTPer,
                SGSTAmount,
                CGSTPer,
                CGSTAmount,
                IGSTPer,
                IGSTAmount,
                RentAmount,
                AmountFromAdvance: (objmy.AmountFromAdvance ? objmy.AmountFromAdvance : 0).toFixed(2),
                AccessAmount: (objmy.TotalAccessAmount ? objmy.TotalAccessAmount : 0).toFixed(2),
                DueAmount: (objmy.TotalDueAmount ? objmy.TotalDueAmount : 0).toFixed(2),
                AmountPay: (objmy.AmountPay ? objmy.AmountPay : 0).toFixed(2),
                AmountPayInWord: objmy.AmountPay > 0 ? (converter.toWords(objmy.AmountPay).replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())) : '',
                ModeOfPayment: objmy.ModeOfPayment,
                PaymentDate: MssqldatetimeFormat(objmy.PaymentDate, 'DD-MMMM-YYYY'),
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
                DocumentSubTypeId: DocumentRentSubTypeIdForReceipt,
                Subdirectory: `Tenant-${PropertyTenantID}`,
                FileExistenceCheck: 0,
                IpAddress: null,
                FileName: `Receipt_${PropertyRentID}.PDF`,
                FileType: 'PDF',
                Description: 'Auto genrated Rent Receipt',
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

const objmyt = {
    PropertyID: '2',
    TenantName: 'Raghav Chaitanya',
    TenantAddress: 'maharashtra',
    TenantEmail: 'joshipooja882@gmail.com',
    TenantMobile: '8490999006',
    RemainingAdvanceAmount: 3400.5,
    CGST: 9,
    SGST: 9,
    IGST: 9,
    PropertyRentID: '63',
    PropertyTenantID: '16',
    RentDueDate: '2021 - 04 - 20T00: 00: 00.000Z',
    RentAmount: 10000.5,
    InvoiceID: 'IN202163',
    InvoiceDate: '2021 - 05 - 22T00: 00: 00.000Z',
    InvoiceDocumentID: '11143',
    RentStartMonthORDate: '2021 - 04 - 08T00: 00: 00.000Z',
    RentEndMonthORDate: '2021 - 05 - 08T00: 00: 00.000Z',
    ReceiptDocumentID: null,
    PaymentDate: '2020 - 06 - 13T00: 00: 00.000Z',
    ModeOfPayment: 'NEFT',
    AmountPay: 20000,
    AccessAmount: 0,
    DueAmount: 0,
    ChequeNo: 'ChequeNo',
    ChequeName: 'ChequeName',
    BankName: 'BankName',
    BankBranchName: 'BankBranchName',
    TransactionID: 'TransactionID',
    WalletName: 'WalletName',
    IpAddress: '::1',
    CreatedAt: '2021 - 05 - 22T14: 02: 00.000Z',
    CreatedBy: '20',
    ModifiedAt: '2021 - 05 - 22T14: 03: 00.000Z',
    ModifiedBy: '1',
    PropertyName: 'safal mondeal',
    CompanyID: 1,
    CompanyName: 'AICC',
    CompanyAddress: null,
    AmountFromAdvance: 100
}

const ALLMonths = [
    {
        ID: 1,
        PropertyRentID: '63',
        AccessAmount: 0,
        DueAmount: 0,
        MonthPaidAmount: 10000.5,
        RentStartMonthORDate: '2021 - 04 - 08T00: 00: 00.000Z',
        RentEndMonthORDate: '2021 - 05 - 08T00: 00: 00.000Z'
    },
    {
        ID: 2,
        PropertyRentID: '64',
        AccessAmount: 0,
        DueAmount: 0,
        MonthPaidAmount: 10000.5,
        RentStartMonthORDate: '2021 - 05 - 08T00: 00: 00.000Z',
        RentEndMonthORDate: '2021 - 06 - 08T00: 00: 00.000Z'
    },
    {
        ID: 3,
        PropertyRentID: '65',
        AccessAmount: 0,
        DueAmount: 9901.5,
        MonthPaidAmount: 99,
        RentStartMonthORDate: '2021 - 06 - 08T00: 00: 00.000Z',
        RentEndMonthORDate: '2021 - 07 - 08T00: 00: 00.000Z'
    }
]

module.exports = GenrateAndStordRentReceipt;