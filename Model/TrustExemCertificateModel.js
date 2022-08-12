module.exports = class TrustExemCertificateModel {

    constructor(TrustID,
        FinYear,
        DateofCertificate,
        NextRenewalDate,
        CreatedBy) {

        this.TrustID = TrustID;
        this.FinYear = FinYear;
        this.DateofCertificate = DateofCertificate;
        this.NextRenewalDate = NextRenewalDate;
        this.CreatedBy = CreatedBy;

    }
}