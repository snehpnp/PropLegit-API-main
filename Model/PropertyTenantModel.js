class PropertyTenantModel {

    constructor(TenantName,
        TenantAddress,
        TenantEmail,
        TenantMobile,
        RentType,
        RentBasedOn,
        ContractStartDate,
        ContractMonth,
        MonthlyORDailyRent,
        RentedSpaceInSqmtr,
        AdvanceDeposite,
        RentDuration,
        RentDueDay,
        BankName,
        BankAccountName,
        GSTNumber,
        BankAccountNumber,
        IFSCCODE,
        MICRCODE,
        TransactionSMSMobileNo,
        Cheque_Favour_OF,
        CGST,
        SGST,
        IGST) {

        this.TenantName = TenantName;
        this.TenantAddress = TenantAddress;
        this.TenantEmail = TenantEmail;
        this.TenantMobile = TenantMobile;
        this.RentType = RentType;
        this.RentBasedOn = RentBasedOn;
        this.ContractStartDate = ContractStartDate;
        this.ContractMonth = ContractMonth;
        this.MonthlyORDailyRent = MonthlyORDailyRent;
        this.RentedSpaceInSqmtr = RentedSpaceInSqmtr;
        this.AdvanceDeposite = AdvanceDeposite;
        this.RentDuration = RentDuration;
        this.RentDueDay = RentDueDay;
        this.BankName = BankName;
        this.BankAccountName = BankAccountName;
        this.GSTNumber = GSTNumber;
        this.BankAccountNumber = BankAccountNumber;
        this.IFSCCODE = IFSCCODE;
        this.MICRCODE = MICRCODE;
        this.TransactionSMSMobileNo = TransactionSMSMobileNo;
        this.Cheque_Favour_OF = Cheque_Favour_OF;
        this.CGST = CGST;
        this.SGST = SGST;
        this.IGST = IGST;
    }

}

module.exports = PropertyTenantModel;