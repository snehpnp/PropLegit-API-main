module.exports = class PublicNoticeModel {
    constructor(
        AppID,
        CertificateContent,
        IssuedDate,
        DocumentUrl
    ) {
        this.AppID = AppID;
        this.CertificateContent = CertificateContent;
        this.IssuedDate = IssuedDate;
        this.DocumentUrl = DocumentUrl;
    }
}