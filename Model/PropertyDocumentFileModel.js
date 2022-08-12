class PropertyDocumentFileModel {

    constructor(PropertyID,
        TrustID,
        FileName,
        DocumentTypeId,
        DocumentSubTypeId,
        FileType,
        Description,
        UserID,
        LegalCaseID,
        IpAddress,
        CreatedBy
    ) {

        this.PropertyID = PropertyID;
        this.TrustID = TrustID;
        this.FileName = FileName;
        this.DocumentTypeId = DocumentTypeId;
        this.DocumentSubTypeId = DocumentSubTypeId;
        this.FileType = FileType;
        this.Description = Description;
        this.UserID = UserID;
        this.LegalCaseID = LegalCaseID;
        this.IpAddress = IpAddress;
        this.CreatedBy = CreatedBy;
    }
}

module.exports = PropertyDocumentFileModel;