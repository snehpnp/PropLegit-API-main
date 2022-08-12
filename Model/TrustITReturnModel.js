module.exports = class TrustITReturnModel {

    constructor(TrustID,
        FinYear,
        Amount,
        ReturnFileDate,
        LawyerID,
        CreatedBy) {

        this.TrustID = TrustID;
        this.FinYear = FinYear;
        this.Amount = Amount;
        this.ReturnFileDate = ReturnFileDate;
        this.LawyerID = LawyerID;
        this.CreatedBy = CreatedBy;
    }
}