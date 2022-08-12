class PropertyTaxReceiptModel{

    constructor(NextDueDate,
        ModeOfPayment,
        PaymentDate,
        AmountPay,
        ChequeNo,
        ChequeName,
        BankName,
        BankBranchName,
        TransactionID,
        WalletName,
        ModifiedBy){
                   
                   
        this.NextDueDate = NextDueDate,
        this.ModeOfPayment = ModeOfPayment,
        this.PaymentDate = PaymentDate,
        this.AmountPay = AmountPay,
        this.ChequeNo = ChequeNo,
        this.ChequeName = ChequeName,
        this.BankName = BankName,
        this.BankBranchName = BankBranchName,
        this.TransactionID = TransactionID,
        this.WalletName = WalletName,
        this.ModifiedBy = ModifiedBy
    }

}

module.exports = PropertyTaxReceiptModel;