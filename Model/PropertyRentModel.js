module.exports = class PropertyRentModel {


    constructor(AmountFromAdvance,
        AmountPay,
        ModeOfPayment,
        PaymentDate,
        ChequeNo,
        ChequeName,
        BankName,
        BankBranchName,
        TransactionID,
        WalletName,
        ModifiedBy) {

        this.AmountFromAdvance = AmountFromAdvance;
        this.AmountPay = AmountPay;
        this.ModeOfPayment = ModeOfPayment;
        this.PaymentDate = PaymentDate;
        this.ChequeNo = ChequeNo;
        this.ChequeName = ChequeName;
        this.BankName = BankName;
        this.BankBranchName = BankBranchName;
        this.TransactionID = TransactionID;
        this.WalletName = WalletName;
        this.ModifiedBy = ModifiedBy;
    }
}