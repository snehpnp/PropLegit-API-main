class PropertyDocumentModel {

    constructor(PropertyID,
        FileName,
        DocumentTypeId,
        DocumentSubTypeId,
        FileType,
        Description,
        UserID,
        LegalCaseID){

        this.PropertyID = PropertyID,
        this.FileName = FileName,
        this.DocumentTypeId = DocumentTypeId,
        this.DocumentSubTypeId = DocumentSubTypeId,
        this.FileType = FileType,
        this.Description = Description,
        this.UserID =  UserID,
        this.LegalCaseID = LegalCaseID
    }

}

module.exports = PropertyDocumentModel;