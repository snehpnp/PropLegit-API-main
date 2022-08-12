class PropertyLegalCaseModel {

    constructor(
        CaseNumber,
        CaseType,
        CaseDescription,
        Iam,
        FilingDate,
        FilingNumber,
        RegistrationNumber,
        RegistrationDate,
        CNRNumber) {

        this.CaseNumber = CaseNumber;
        this.CaseType = CaseType;
        this.CaseDescription = CaseDescription;
        this.Iam = Iam;
        this.FilingDate = FilingDate;
        this.FilingNumber = FilingNumber;
        this.RegistrationNumber = RegistrationNumber;
        this.RegistrationDate = RegistrationDate;
        this.CNRNumber = CNRNumber;

    }

}


module.exports = PropertyLegalCaseModel;