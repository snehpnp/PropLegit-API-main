module.exports = class TrustFundModel {

    constructor(TrustID,
        FinYear,
        FundAmount,
        FundRegisterDate,
        FundNextDueDate,
        CreatedBy) {

        this.TrustID = TrustID;
        this.FinYear = FinYear;
        this.FundAmount = FundAmount;
        this.FundRegisterDate = FundRegisterDate;
        this.FundNextDueDate = FundNextDueDate;
        this.CreatedBy = CreatedBy;

    }
}