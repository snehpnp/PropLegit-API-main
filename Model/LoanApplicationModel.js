module.exports = class LoanApplicationModel {

    constructor(ApplicationNo,
        CitySurveyNumber,
        ApplicantFirstName,
        ApplicantLastName,
        MobileNo,
        Email,
        IsOwnerSame,
        PropertyAddress,
        LoanPropertyTypeID,
        VillageID,
        HobliID,
        TalukaID,
        DistrictID,
        SurveyNo,
        TpNo,
        FpNo,
        IsLien,
        LienAmount,
        LienDate,
        LienPersonName,
        LienFrom,
        LoanAmount,
        TypeOfLoan,
        HissaNo) {

        this.ApplicationNo = ApplicationNo;
        this.CitySurveyNumber = CitySurveyNumber;
        this.ApplicantFirstName = ApplicantFirstName;
        this.ApplicantLastName = ApplicantLastName;
        this.MobileNo = MobileNo;
        this.Email = Email;
        this.IsOwnerSame = IsOwnerSame;
        this.PropertyAddress = PropertyAddress;
        this.LoanPropertyTypeID = LoanPropertyTypeID;
        this.VillageID = VillageID;
        this.TalukaID = TalukaID;
        this.DistrictID = DistrictID;
        this.HobliID = HobliID;
        this.SurveyNo = SurveyNo;
        this.TpNo = TpNo;
        this.FpNo = FpNo;
        this.IsLien = IsLien == 'true' ? 1 : 0;
        this.LienAmount = LienAmount;
        this.LienDate = LienDate;
        this.LienPersonName = LienPersonName;
        this.LienFrom = LienFrom;
        this.LoanAmount = LoanAmount;
        this.TypeOfLoan = TypeOfLoan;
        this.HissaNo = HissaNo;
    }

}