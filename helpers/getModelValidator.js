module.exports = (stateID, data) => {
  let model;
  switch (stateID) {
    case '7':
      model = {
        //Gujarat
        ApplicationNo: 'required',
        ApplicantFirstName: 'required|maxLength:55',
        ApplicantLastName: 'required|maxLength:55',
        MobileNo: 'required|minLength:10|MobileCheck',
        Email: 'required|email',
        IsOwnerSame: 'required|string',
        PropertyOwners: 'array',
        'PropertyOwners.*.OwnerName':
          data.IsOwnerSame == 'false' ? 'required|string' : '',
        BaseDocumentType: 'CheckBaseDocumentType|required',
        DistrictName: 'required|string',
        PropertyType: 'required',
        TypeOfLoan: 'required',
        LoanAmount: 'required|integer|min:1',
        PropertyAddress: 'required',
        SurveyNo:
          data.BaseDocumentType == '712'
            ? !data.TpNo && !data.FpNo
              ? 'required'
              : 'string'
            : 'string',
        TpNo:
          data.BaseDocumentType == '712'
            ? data.SurveyNo
              ? 'string'
              : 'required'
            : 'string',
        FpNo:
          data.BaseDocumentType == '712'
            ? data.SurveyNo
              ? 'string'
              : 'required'
            : 'string',

        TalukaName: data.BaseDocumentType == '712' ? 'required' : 'string',
        VillageName: data.BaseDocumentType == '712' ? 'required' : 'string',
        CitySurveyNumber: data.BaseDocumentType
          ? data.BaseDocumentType.toLowerCase() == 'propertycard'
            ? 'required'
            : 'string'
          : 'string',
        CitySurveyOfficeName: data.BaseDocumentType
          ? data.BaseDocumentType.toLowerCase() == 'propertycard'
            ? 'required'
            : 'string'
          : 'string',
        WardName: data.BaseDocumentType
          ? data.BaseDocumentType.toLowerCase() == 'propertycard'
            ? 'required'
            : 'string'
          : 'required',
        FlatSocietySchemeName: data.FlatBuildingPlotShopNo
          ? 'required'
          : 'string',
        FlatBuildingPlotShopNo: data.FlatSocietySchemeName
          ? 'required'
          : 'string',
        LienAmount:
          data.IsLien == 'true' ? 'required|integer|min:1' : 'integer|min:1',
        LienDate:
          data.IsLien == 'true'
            ? 'required|dateFormat:YYYY-MM-DD'
            : 'string|dateFormat:YYYY-MM-DD',
        LienPersonName: data.IsLien == 'true' ? 'required' : 'string',
        LienFrom: data.IsLien == 'true' ? 'required' : 'string',
      };
      break;
    case '12':
      model = {
        //Karnataka
        //   State * Base Document Type * District * Taluka * Hobli *
        //   Block, Village * PropertyType *
        ApplicationNo: 'required',
        ApplicantFirstName: 'required|maxLength:55',
        ApplicantLastName: 'required|maxLength:55',
        MobileNo: 'required|minLength:10|MobileCheck',
        Email: 'required|email',
        IsOwnerSame: 'required|string',
        PropertyOwners: 'array',
              'PropertyOwners.*.OwnerName':
              data.IsOwnerSame == 'false' ? 'required|string' : '',
        BaseDocumentType: 'CheckBaseDocumentType|required',
        DistrictName: 'required|string',
        TalukaName: data.BaseDocumentType == '712' ? 'required' : 'string',
        VillageName: 'required|string',
        PropertyType: 'required',
        HobliName: data.BaseDocumentType == '712' ? 'required' : 'string',
        TypeOfLoan: 'required',
        LoanAmount: 'required|integer|min:1',
        PropertyAddress: 'required',
        SurveyNo: 'required|string',
  
        BlockName: data.BaseDocumentType
          ? data.BaseDocumentType.toLowerCase() == 'propertycard'
            ? 'required': 'string': 'string',
        GramPanchayatName: data.BaseDocumentType
          ? data.BaseDocumentType.toLowerCase() == 'propertycard'
            ? 'required' : 'string' : 'string',
       
        IsLien: 'required',

        LienAmount:
          data.IsLien == 'true' ? 'required|integer|min:1' : 'integer|min:1',
        LienDate:
          data.IsLien == 'true'
            ? 'required|dateFormat:YYYY-MM-DD'
            : 'string|dateFormat:YYYY-MM-DD',
        LienPersonName: data.IsLien == 'true' ? 'required' : 'string',
        LienFrom: data.IsLien == 'true' ? 'required' : 'string',
      };
      break;
    case '15':
      model = {
        //Maharashtra
        //712 village ,taluka, and dis, and surveyno 
        //propertycard region ,dis ,city survey office ,village,city survey no,
        // if bulding num enter societyname compulsory ,if societyname enter buldinno compulsory
        ApplicationNo: 'required',
        ApplicantFirstName: 'required|maxLength:55',
        ApplicantLastName: 'required|maxLength:55',
        MobileNo: 'required|minLength:10|MobileCheck',
        Email: 'required|email',
        IsOwnerSame: 'required|string',
        PropertyOwners: 'array',
        'PropertyOwners.*.OwnerName':
          data.IsOwnerSame == 'false' ? 'required|string' : '',
        BaseDocumentType: 'CheckBaseDocumentType|required',
        StateName: 'required|string',
        DistrictName: 'required|string',
        TalukaName: data.BaseDocumentType == '712' ? 'required' : 'string',
        VillageName: 'required|string',
        PropertyType: 'required',
        PropertyAddress: 'required',
        SurveyGatNo: data.BaseDocumentType == '712' ? 'required' : 'string',
        Region: data.BaseDocumentType ? data.BaseDocumentType.toLowerCase() == 'propertycard' ? 'required' : 'string' : 'string',
        CitySurveyOfficeName: data.BaseDocumentType 
                      ? data.BaseDocumentType.toLowerCase() == 'propertycard'
                      ? 'required' 
                      : 'string' 
                      : 'string',
        CitySurveyNumber: data.BaseDocumentType 
                  ? data.BaseDocumentType.toLowerCase() == 'propertycard' 
                  ? 'required' 
                  : 'string' 
                  : 'string',
        PropertyType: 'required',
        PropertyAddress: 'required',
        BlockNo : data.SocietyName ? 'required' : 'string',
        SocietyName : data.BlockNo ? 'required' : 'string',
        LoanAmount: 'required|integer|min:1',
        IsLien: 'required',
        LienAmount:
          data.IsLien == 'true' ? 'required|integer|min:1' : 'integer|min:1',
        LienDate:
          data.IsLien == 'true'
            ? 'required|dateFormat:YYYY-MM-DD'
            : 'string|dateFormat:YYYY-MM-DD',
        LienPersonName: data.IsLien == 'true' ? 'required' : 'string',
        LienFrom: data.IsLien == 'true' ? 'required' : 'string',
      };
      break; 
    case '22':
      model = {
        //Rajashthan
        //712 rural :- dist, taisil, vilage,khatano
        //propertycard urben:- dist, taisil, vilage,khatano

        ApplicationNo: 'required',
        ApplicantFirstName: 'required|maxLength:55',
        ApplicantLastName: 'required|maxLength:55',
        MobileNo: 'required|minLength:10|MobileCheck',
        Email: 'required|email',
        IsOwnerSame: 'required|string',
        PropertyOwners: 'array',
        'PropertyOwners.*.OwnerName':
          data.IsOwnerSame == 'false' ? 'required|string' : '',

        BaseDocumentType: 'CheckBaseDocumentType|required',
        DistrictName: data.BaseDocumentType 
                  ? data.BaseDocumentType.toLowerCase() == 'propertycard' || data.BaseDocumentType == '712'
                  ? 'required' 
                  : 'string' 
                  : 'string',
        TalukaName: data.BaseDocumentType 
                  ? data.BaseDocumentType.toLowerCase() == 'propertycard' || data.BaseDocumentType == '712'
                  ? 'required' 
                  : 'string' 
                  : 'string',
        VillageName: data.BaseDocumentType 
                  ? data.BaseDocumentType.toLowerCase() == 'propertycard' || data.BaseDocumentType == '712'
                  ? 'required' 
                  : 'string' 
                  : 'string',
        KhataNo:  data.BaseDocumentType 
                  ? data.BaseDocumentType.toLowerCase() == 'propertycard' || data.BaseDocumentType == '712'
                  ? 'required' 
                  : 'string' 
                  : 'string',
        PropertyType: 'required',

        TypeOfLoan: 'required',
        LoanAmount: 'required|integer|min:1',

        PropertyAddress: 'required',
        IsLien: 'required',
     
        LienAmount:
          data.IsLien == 'true' ? 'required|integer|min:1' : 'integer|min:1',
        LienDate:
          data.IsLien == 'true'
            ? 'required|dateFormat:YYYY-MM-DD'
            : 'string|dateFormat:YYYY-MM-DD',
        LienPersonName: data.IsLien == 'true' ? 'required' : 'string',
        LienFrom: data.IsLien == 'true' ? 'required' : 'string',
      };
      break;
    case '24':
      model = {
        //TamilNadu
        //712 rural :- Dist, taluk, village and either survey no or patta no compulsary
        //propertycard urben:- Dist, taluk, town, ward and block, survey no - All are compulsary

        ApplicationNo: 'required',
        ApplicantFirstName: 'required|maxLength:55',
        ApplicantLastName: 'required|maxLength:55',
        MobileNo: 'required|minLength:10|MobileCheck',
        Email: 'required|email',
        IsOwnerSame: 'required|string',
        PropertyOwners: 'array',
        'PropertyOwners.*.OwnerName':
          data.IsOwnerSame == 'false' ? 'required|string' : '',

        StateName: 'required|string',
        BaseDocumentType: 'CheckBaseDocumentType|required',
        DistrictName: 'required|string',
        TalukaName: 'required|string',
        VillageName: data.BaseDocumentType == '712' ? 'required' : 'string',
        TNTown: data.BaseDocumentType ? data.BaseDocumentType.toLowerCase() == 'propertycard' ? 'required' : 'string' : 'string',
        TNWard: data.BaseDocumentType ? data.BaseDocumentType.toLowerCase() == 'propertycard' ? 'required' : 'string' : 'string',
        TNBlock: data.BaseDocumentType ? data.BaseDocumentType.toLowerCase() == 'propertycard' ? 'required' : 'string' : 'string',
        PropertyType: 'required',
        PropertyAddress: 'required',
        SurveyNo: data.BaseDocumentType == '712' ? (!data.PattaNumber ? 'required' : 'string') : 'required', 
        PattaNumber: data.BaseDocumentType == '712' ? (!data.SurveyNo ? 'required' : 'string') : 'string',
        TypeOfLoan: 'required',
        LoanAmount: 'required|integer|min:1',
        IsLien: 'required',

        
      
        LienAmount:
          data.IsLien == 'true' ? 'required|integer|min:1' : 'integer|min:1',
        LienDate:
          data.IsLien == 'true'
            ? 'required|dateFormat:YYYY-MM-DD'
            : 'string|dateFormat:YYYY-MM-DD',
        LienPersonName: data.IsLien == 'true' ? 'required' : 'string',
        LienFrom: data.IsLien == 'true' ? 'required' : 'string',
      };
      break;   
    case '25':
      model = {
          //Telangana:
          // Rural only: District, Mandal, village, survey no /sub division no, khata no - All are compulsary
  
          ApplicationNo: 'required',
          ApplicantFirstName: 'required|maxLength:55',
          ApplicantLastName: 'required|maxLength:55',
          MobileNo: 'required|minLength:10|MobileCheck',
          Email: 'required|email',
          IsOwnerSame: 'required|string',
          PropertyOwners: 'array',
          'PropertyOwners.*.OwnerName':
            data.IsOwnerSame == 'false' ? 'required|string' : '',
  
          StateName: 'required|string',
          BaseDocumentType: 'CheckBaseDocumentType|required',
          DistrictName: 'required|string',
          MandalName: 'required|string',
          VillageName: 'required|string',
          SurveyNo: data.BaseDocumentType == '712' ? 'required' : 'string', 
          KhataNo: data.BaseDocumentType == '712' ? 'required' : 'string',
          TSULBName: data.BaseDocumentType ? data.BaseDocumentType.toLowerCase() == 'propertycard' ? 'required' : 'string' : 'string',
          TSPTINNo: data.BaseDocumentType ? data.BaseDocumentType.toLowerCase() == 'propertycard' ? 'required' : 'string' : 'string',
          TSDoorNo: data.BaseDocumentType ? data.BaseDocumentType.toLowerCase() == 'propertycard' ? 'required' : 'string' : 'string',
          TSCircleName: data.BaseDocumentType ? data.BaseDocumentType.toLowerCase() == 'propertycard' ? 'required' : 'string' : 'string',
          PropertyType: 'required',
          PropertyAddress: 'required',
          TypeOfLoan: 'required',
          LoanAmount: 'required|integer|min:1',
          IsLien: 'required',
          LienAmount:
            data.IsLien == 'true' ? 'required|integer|min:1' : 'integer|min:1',
          LienDate:
            data.IsLien == 'true'
              ? 'required|dateFormat:YYYY-MM-DD'
              : 'string|dateFormat:YYYY-MM-DD',
          LienPersonName: data.IsLien == 'true' ? 'required' : 'string',
          LienFrom: data.IsLien == 'true' ? 'required' : 'string',
        };
      break;   
  }
  return model;
};
