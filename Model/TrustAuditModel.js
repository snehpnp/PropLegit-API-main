module.exports = class TrustAuditModel {

    constructor(TrustID,
        FinYear,
        AuditDate,
        TrusteeUserID,
        CreatedBy) {

        this.TrustID = TrustID;
        this.FinYear = FinYear;
        this.AuditDate = AuditDate;
        this.TrusteeUserID = TrusteeUserID;
        this.CreatedBy = CreatedBy;
    }
}