class PropertyModel {


    constructor(PropertyTypeID, VillageID, TalukaID, DistrictID, StateID, PropertyName, CitySurveyNo, 
        CitySurveyOffice, CityWardNo, CityWardName, SheetNumber, SurveyNo, TPNo, FPNo, BuildingNo, BuildingName, RecordDate, 
        milkatno_propId, RevenewOfficeType, ModifiedBy) {

        this.PropertyTypeID = PropertyTypeID;
        this.TalukaID = TalukaID;
        this.DistrictID = DistrictID;
        this.VillageID = VillageID;
        this.StateID = StateID;
        this.PropertyName = PropertyName,
        this.CitySurveyNo = CitySurveyNo;
        this.CitySurveyOffice = CitySurveyOffice;
        this.CityWardNo = CityWardNo,
        this.CityWardName = CityWardName,
        this.SheetNumber = SheetNumber;
        this.SurveyNo = SurveyNo;
        this.TPNo = TPNo;
        this.FPNo = FPNo;
        this.BuildingNo = BuildingNo
        this.BuildingName = BuildingName;
        this.RecordDate = RecordDate;
        this.milkatno_propId = milkatno_propId,
        this.RevenewOfficeType = RevenewOfficeType,
        this.ModifiedBy = ModifiedBy
    }
}

module.exports = PropertyModel;