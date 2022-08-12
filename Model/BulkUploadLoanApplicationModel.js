module.exports = class BulkUploadLoanApplicationModel {
  constructor({
    ApplicationNo,
    CitySurveyNumber,
    CitySurveyOfficeID,
    ApplicantFirstName,
    ApplicantLastName,
    MobileNo,
    Email,
    IsOwnerSame,
    PropertyAddress,
    LoanPropertyTypeID,
    VillageID,
    TalukaID,
    DistrictID,
    HobliID,
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
    BaseDocumentType,
    SurveyGatNo,
    RegionID,
    KhataNo,
    HissaNo,
    WardID,
    Ward,
    SheetNo,
    FlatBuildingPlotShopNo,
    FlatSocietySchemeName,
  }) {
    this.ApplicationNo = ApplicationNo;
    this.CitySurveyNumber = CitySurveyNumber;
    this.CitySurveyOfficeID = CitySurveyOfficeID;
    this.ApplicantFirstName = ApplicantFirstName;
    this.ApplicantLastName = ApplicantLastName;
    this.MobileNo = MobileNo;
    this.Email = Email;
    this.IsOwnerSame = IsOwnerSame ? 1 : 0;
    this.PropertyAddress = PropertyAddress;
    this.LoanPropertyTypeID = LoanPropertyTypeID;
    this.VillageID = VillageID;
    this.TalukaID = TalukaID;
    this.DistrictID = DistrictID;
    this.HobliID = HobliID;
    this.SurveyNo = SurveyNo;
    this.TpNo = TpNo;
    this.FpNo = FpNo;
    this.IsLien = IsLien ? 1 : 0;
    this.LienAmount = LienAmount;
    this.LienDate = LienDate;
    this.LienPersonName = LienPersonName;
    this.LienFrom = LienFrom;
    this.LoanAmount = LoanAmount;
    this.TypeOfLoan = TypeOfLoan;
    this.BaseDocumentType = BaseDocumentType;
    this.SurveyGatNo = SurveyGatNo;
    this.RegionID = RegionID;
    this.KhataNo = KhataNo;
    this.HissaNo = HissaNo;
    this.WardID = WardID;
    this.CityWardName = Ward;
    this.CityWardNo = Ward;
    this.SheetNumber = SheetNo;
    this.BuildingNo = FlatBuildingPlotShopNo;
    this.BuildingName = FlatSocietySchemeName;
  }
};
