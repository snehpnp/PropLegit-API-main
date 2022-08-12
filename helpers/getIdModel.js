module.exports = (stateID, data) => {
  let model;
  switch (stateID) {
    case '7':
      model = {
        //Gujrat
        StateID: 'required',
        DistrictID: 'required',
        TalukaID: data.BaseDocumentType == '712' ? 'required' : 'string',
        VillageID: data.BaseDocumentType == '712' ? 'required' : 'string',
        CitySurveyOfficeID: data.BaseDocumentType
          ? data.BaseDocumentType.toLowerCase() == 'propertycard'
            ? 'required'
            : 'string'
          : 'string',
        WardID: data.BaseDocumentType
          ? data.BaseDocumentType.toLowerCase() == 'propertycard'
            ? 'required'
            : 'string'
          : 'string',
        TypeOfLoan: 'required',
        LoanPropertyTypeID: 'required',
      };
      break;
    
    case '12':
      // Karnataka
      // State * Base Document Type * District * Taluka * Hobli *
      //   Block, Village * PropertyType *
      model = {
        StateID: 'required',
        DistrictID: 'required',
        TalukaID: data.BaseDocumentType == '712' ? data.TalukaName ? 'required' : 'string' : 'string',
        VillageID:'required',
        HobliID: data.BaseDocumentType == '712' ? data.HobliName ? 'required' : 'string' : 'string',
        BlockID: data.BlockName ? 'required' : 'string',
        GramPanchayatID: data.GramPanchayatName ? 'required' : 'string',
        TypeOfLoan: 'required',
        LoanPropertyTypeID: 'required',
      };
      break;
    
    case '15':
      model = {
       //Maharashtra
        //712 village ,taluka, and dis, and surveyno 
        //propertycard region ,dis ,city survey office ,village,city survey no,
        // if bulding num enter societyname compulsory ,if societyname enter buldinno compulsory
        StateID: 'required',
        DistrictID: 'required',
        TalukaID: data.BaseDocumentType == '712' ? data.TalukaName ? 'required' : 'string' : 'string',
        VillageID:'required',
        RegionID: data.Region ? 'required' : 'string',
        CitySurveyOfficeID: data.BaseDocumentType
        ? data.BaseDocumentType.toLowerCase() == 'propertycard'
          ? 'required'
          : 'string'
        : 'string',
        TypeOfLoan: 'required',
        LoanPropertyTypeID: 'required',
      };
      break;
    
    case '22':
      model = {
        
        //Rajashthan
        //712 rural :- dist, taisil, vilage,khatano
        //propertycard urben:- dist, taisil, vilage,khatano

        StateID: 'required',
        DistrictID: 'required',
        TalukaID: 'required',
        VillageID: 'required',
        TypeOfLoan: 'required',
        LoanPropertyTypeID: 'required',
      };
    break;
    
    case '24':
      model = {
         //TamilNadu
        StateID: 'required',
        DistrictID: 'required',
        TalukaID: data.BaseDocumentType == '712' ? 'required' : 'string',
        VillageID: data.BaseDocumentType == '712' ? 'required' : 'string',
        TNTownID: data.TNTown ? 'required' : 'string',
        TNWardID: data.TNWard ? 'required' : 'string',
        TNBlockID: data.TNBlock ? 'required' : 'string',
        TypeOfLoan: 'required',
        LoanPropertyTypeID: 'required',
      };
      break;

    case '25':
      model = {
        //Telangana:
        StateID: 'required',
        DistrictID: 'required',
        TalukaID: data.BaseDocumentType == '712' ? 'required' : 'string',
        VillageID: data.BaseDocumentType == '712' ? 'required' : 'string',
        TSULBID: data.TSULBName ? 'required' : 'string',
        TSCircleID: data.TSCircleName ? 'required' : 'string',
        TypeOfLoan: 'required',
        LoanPropertyTypeID: 'required',
      };
      break;

  }
  return model;
};
