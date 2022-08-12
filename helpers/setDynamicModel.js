const moment = require('moment');
module.exports = (stateID, row) => {
  let model = {};
  switch (stateID) {
    case '7': 
      model = {
        //Gujarat
        ApplicantFirstName: row[0] ? row[0] : '',
        ApplicantLastName: row[1] ? row[1] : '',
        ApplicationNo: row[2] ? row[2].toString() : '',
        MobileNo: row[3] ? row[3].toString() : '',
        Email: row[4] ? row[4] : '',
        IsOwnerSame: row[5]
          ? row[5].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        PropertyOwners: [],
        StateName: row[7] ? row[7] : '',
        BaseDocumentType:
          row[8] == '7/12' || row[8] == '712'
            ? '712'
            : row[8] == 'propertycard' || row[8] == 'property card'
            ? 'propertycard'
            : '',
        DistrictName: row[9] ? row[9] : '',
        TalukaName: row[10] ? row[10] : '',
        VillageName: row[11] ? row[11] : '',
        PropertyType: row[12] ? row[12] : '',
        PropertyAddress: row[13] ? row[13] : '',
        SurveyNo: row[14] ? row[14].toString() : '',
        TpNo: row[15] ? row[15].toString() : '',
        FpNo: row[16] ? row[16].toString() : '',
        KhataNo: row[17] ? row[17].toString() : '',
        CitySurveyOfficeName: row[18] ? row[18].toString() : '',
        WardName: row[19] ? row[19].toString() : '',
        CitySurveyNumber: row[20] ? row[20].toString() : '',
        FlatBuildingPlotShopNo: row[21] ? row[21].toString() : '',
        FlatSocietySchemeName: row[22] ? row[22].toString() : '',
        TypeOfLoan: row[23] ? row[23].toString() : '',
        LoanAmount: row[24] ? row[24].toString() : '',
        IsLien: row[25]
          ? row[25].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        LienPersonName: row[26] ? row[26] : '',
        LienFrom: row[27] ? row[27] : '',
        LienAmount: row[28] ? row[28] : '',
        LienDate: row[29] ? row[29].toString() : '',
      };
      if (row[6] && typeof row[6] === 'string') {
        let ownernames = row[6].toString().split(',');
        ownernames.forEach((element) => {
          let owner = { OwnerName: element };
          model.PropertyOwners.push(owner);
        });
      } else {
        model.PropertyOwners.push({ OwnerName: '' });
      }

      if (typeof row[29] === 'number') {
        model.LienDate = row[29]
          ? moment(
              new Date(Math.round((row[29] - 25569) * 86400 * 1000)),
            ).format('YYYY-MM-DD')
          : '';
      } else if (typeof row[29] === 'string') {
        model.LienDate = row[29] ? moment(row[29]).format('YYYY-MM-DD') : '';
      };
      break;
    
    case '12':
      model = {
        // dataExtraction folder name finalfile in karnatal
        //Karnataka
        ApplicantFirstName: row[0] ? row[0] : '',
        ApplicantLastName: row[1] ? row[1] : '',
        ApplicationNo: row[2] ? row[2].toString() : '',
        MobileNo: row[3] ? row[3].toString() : '',
        Email: row[4] ? row[4] : '',
        IsOwnerSame: row[5]
          ? row[5].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        PropertyOwners: [],
        StateName: row[7] ? row[7] : '',
        BaseDocumentType:
          row[8] == '7/12' || row[8] == '712'
            ? '712'
            : row[8] == 'propertycard' || row[8] == 'property card'
              ? 'propertycard'
              : '',
        DistrictName: row[9] ? row[9] : '',
        TalukaName: row[10] ? row[10] : '',
        HobliName: row[11] ? row[11] : '',
        VillageName: row[12] ? row[12] : '',
        PropertyType: row[13] ? row[13] : '',
        PropertyAddress: row[14] ? row[14] : '',
        SurveyNo: row[15] ? row[15].toString() : '',
        HissaNo: row[16] ? row[16].toString() : '',
        BlockName: row[17] ? row[17].toString() : '',
        GramPanchayatName: row[18] ? row[18].toString() : '',
        PropertyID: row[19] ? row[19].toString() : '',
       
        
        TypeOfLoan: row[20] ? row[20].toString() : '',
        LoanAmount: row[21] ? row[21].toString() : '',
        IsLien: row[22]
          ? row[22].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        LienPersonName: row[23] ? row[23] : '',
        LienFrom: row[24] ? row[24] : '',
        LienAmount: row[25] ? row[25] : '',
        LienDate: row[26] ? row[26].toString() : '',
      };
      if (row[6] && typeof row[6] === 'string') {
        let ownernames = row[6].toString().split(',');
        ownernames.forEach((element) => {
          let owner = { OwnerName: element };
          model.PropertyOwners.push(owner);
        });
      } else {
        model.PropertyOwners.push({ OwnerName: '' });
      }

      if (typeof row[26] === 'number') {
        model.LienDate = row[26]
          ? moment(
            new Date(Math.round((row[26] - 25569) * 86400 * 1000)),
          ).format('YYYY-MM-DD')
          : '';
      } else if (typeof row[26] === 'string') {
        model.LienDate = row[26] ? moment(row[26]).format('YYYY-MM-DD') : '';
      };
      break;

    case '15':
      model = {
        //Maharashtra
        ApplicantFirstName: row[0] ? row[0] : '',
        ApplicantLastName: row[1] ? row[1] : '',
        ApplicationNo: row[2] ? row[2].toString() : '',
        MobileNo: row[3] ? row[3].toString() : '',
        Email: row[4] ? row[4] : '',
        IsOwnerSame: row[5]
          ? row[5].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        PropertyOwners: [],
        StateName: row[7] ? row[7] : '',
        BaseDocumentType:
          row[8] == '7/12' || row[8] == '712'
            ? '712'
            : row[8] == 'propertycard' || row[8] == 'property card'
              ? 'propertycard'
              : '',
        DistrictName: row[9] ? row[9] : '',
        TalukaName: row[10] ? row[10] : '',
        VillageName: row[11] ? row[11] : '',
        PropertyType: row[12] ? row[12] : '',
        PropertyAddress: row[13] ? row[13] : '',
        SurveyGatNo: row[14] ? row[14].toString() : '',
        HissaNo: row[15] ? row[15].toString() : '',
        KhataNo: row[16] ? row[16].toString() : '',
        Region: row[17] ? row[17].toString() : '',
        CitySurveyOfficeName: row[18] ? row[18].toString() : '',
        

        CitySurveyNumber: row[19] ? row[19].toString() : '',

        BlockNo : row[20] ? row[20].toString() : '',

        SocietyName: row[21] ? row[21].toString() : '',

        TypeOfLoan: row[22] ? row[22].toString() : '',
        LoanAmount: row[23] ? row[23].toString() : '',
        IsLien: row[24]
          ? row[24].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        LienPersonName: row[25] ? row[25] : '',
        LienFrom: row[26] ? row[26] : '',
        LienAmount: row[27] ? row[27] : '',
        LienDate: row[28] ? row[28].toString() : '',
      };
      if (row[6] && typeof row[6] === 'string') {
        let ownernames = row[6].toString().split(',');
        ownernames.forEach((element) => {
          let owner = { OwnerName: element };
          model.PropertyOwners.push(owner);
        });
      } else {
        model.PropertyOwners.push({ OwnerName: '' });
      }

      if (typeof row[28] === 'number') {
        model.LienDate = row[28]
          ? moment(
            new Date(Math.round((row[28] - 25569) * 86400 * 1000)),
          ).format('YYYY-MM-DD')
          : '';
      } else if (typeof row[28] === 'string') {
        model.LienDate = row[28] ? moment(row[28]).format('YYYY-MM-DD') : '';
      };
      break;

    case '22':
      model = {
        //Rajashthan
        ApplicantFirstName: row[0] ? row[0] : '',
        ApplicantLastName: row[1] ? row[1] : '',
        ApplicationNo: row[2] ? row[2].toString() : '',
        MobileNo: row[3] ? row[3].toString() : '',
        Email: row[4] ? row[4] : '',
        IsOwnerSame: row[5]
          ? row[5].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        PropertyOwners: [],
        StateName: row[7] ? row[7] : '',
        BaseDocumentType:
          row[8] == '7/12' || row[8] == '712'
            ? '712'
            : row[8] == 'propertycard' || row[8] == 'property card'
              ? 'propertycard'
              : '',
        DistrictName: row[9] ? row[9] : '',
        TalukaName: row[10] ? row[10] : '',

        VillageName: row[11] ? row[11] : '',
        PropertyType: row[12] ? row[12] : '',
        PropertyAddress: row[13] ? row[13] : '',
        KhasraNo: row[14] ? row[14] : '',
        KhataNo: row[15] ? row[15] : '',
      

        BlockNo: row[16] ? row[16].toString() : '',

        SocietyName: row[17] ? row[17].toString() : '',

        TypeOfLoan: row[18] ? row[18].toString() : '',
        LoanAmount: row[19] ? row[19].toString() : '',
        IsLien: row[20]
          ? row[20].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        LienPersonName: row[21] ? row[21] : '',
        LienFrom: row[22] ? row[22] : '',
        LienAmount: row[23] ? row[23] : '',
        LienDate: row[24] ? row[24].toString() : '',
      };
      if (row[6] && typeof row[6] === 'string') {
        let ownernames = row[6].toString().split(',');
        ownernames.forEach((element) => {
          let owner = { OwnerName: element };
          model.PropertyOwners.push(owner);
        });
      } else {
        model.PropertyOwners.push({ OwnerName: '' });
      }

      if (typeof row[24] === 'number') {
        model.LienDate = row[24]
          ? moment(
            new Date(Math.round((row[24] - 25569) * 86400 * 1000)),
          ).format('YYYY-MM-DD')
          : '';
      } else if (typeof row[24] === 'string') {
        model.LienDate = row[24] ? moment(row[24]).format('YYYY-MM-DD') : '';
      };
      break;

    case '24':
      model = {
        //Tamilnadu
        ApplicantFirstName: row[0] ? row[0] : '',
        ApplicantLastName: row[1] ? row[1] : '',
        ApplicationNo: row[2] ? row[2].toString() : '',
        MobileNo: row[3] ? row[3].toString() : '',
        Email: row[4] ? row[4] : '',
        IsOwnerSame: row[5]
          ? row[5].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        PropertyOwners: [],
        StateName: row[7] ? row[7] : '',
        BaseDocumentType:
          row[8] == '7/12' || row[8] == '712'
            ? '712'
            : row[8] == 'propertycard' || row[8] == 'property card'
              ? 'propertycard'
              : '',
        DistrictName: row[9] ? row[9] : '',
        TalukaName: row[10] ? row[10] : '',
        
        VillageName: row[11] ? row[11] : '',
        TNTown: row[12] ? row[12] : '',
        TNWard: row[13] ? row[13] : '',
        TNBlock: row[14] ? row[14] : '',
        PropertyType: row[15] ? row[15] : '',
        PropertyAddress: row[16] ? row[16] : '',
        SurveyNo: row[17] ? row[17].toString() : '',
        SubDivision: row[18] ? row[18].toString() : '',
        PattaNumber: row[19] ? row[19].toString() : '',
        BlockNo : row[20] ? row[20].toString() : '',   

        SocietyName: row[21] ? row[21].toString() : '',

        TypeOfLoan: row[22] ? row[22].toString() : '',
        LoanAmount: row[23] ? row[23].toString() : '',
        IsLien: row[24]
          ? row[24].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        LienPersonName: row[25] ? row[25] : '',
        LienFrom: row[26] ? row[26] : '',
        LienAmount: row[27] ? row[27] : '',
        LienDate: row[28] ? row[28].toString() : '',
      };
      if (row[6] && typeof row[6] === 'string') {
        let ownernames = row[6].toString().split(',');
        ownernames.forEach((element) => {
          let owner = { OwnerName: element };
          model.PropertyOwners.push(owner);
        });
      } else {
        model.PropertyOwners.push({ OwnerName: '' });
      }

      if (typeof row[28] === 'number') {
        model.LienDate = row[28]
          ? moment(
            new Date(Math.round((row[28] - 25569) * 86400 * 1000)),
          ).format('YYYY-MM-DD')
          : '';
      } else if (typeof row[28] === 'string') {
        model.LienDate = row[28] ? moment(row[28]).format('YYYY-MM-DD') : '';
      };
      break;
    case '25':
      model = {
        //Telangana
        ApplicantFirstName: row[0] ? row[0] : '',
        ApplicantLastName: row[1] ? row[1] : '',
        ApplicationNo: row[2] ? row[2].toString() : '',
        MobileNo: row[3] ? row[3].toString() : '',
        Email: row[4] ? row[4] : '',
        IsOwnerSame: row[5]
          ? row[5].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        PropertyOwners: [],
        StateName: row[7] ? row[7] : '',
        BaseDocumentType:
          row[8] == '7/12' || row[8] == '712'
            ? '712'
            : row[8] == 'propertycard' || row[8] == 'property card'
              ? 'propertycard'
              : '',
        DistrictName: row[9] ? row[9] : '',
        MandalName: row[10] ? row[10] : '',
        VillageName: row[11] ? row[11] : '',
        SurveyNo: row[12] ? row[12].toString() : '',
        KhataNo: row[13] ? row[13].toString() : '',
        TSULBName: row[14] ? row[14] : '',
        TSPTINNo: row[15] ? row[15] : '',
        TSDoorNo: row[16] ? row[16] : '',
        TSCircleName: row[17] ? row[17] : '',
        PropertyType: row[18] ? row[18] : '',
        PropertyAddress: row[19] ? row[19] : '',
        BlockNo : row[20] ? row[20].toString() : '',
        SocietyName: row[21] ? row[21].toString() : '',
        TypeOfLoan: row[22] ? row[22].toString() : '',
        LoanAmount: row[23] ? row[23].toString() : '',
        IsLien: row[24]
          ? row[24].toLowerCase() == 'yes'
            ? 'true'
            : 'false'
          : 'false',
        LienPersonName: row[25] ? row[25] : '',
        LienFrom: row[26] ? row[26] : '',
        LienAmount: row[27] ? row[27] : '',
        LienDate: row[28] ? row[28].toString() : '',
      };
      if (row[6] && typeof row[6] === 'string') {
        let ownernames = row[6].toString().split(',');
        ownernames.forEach((element) => {
          let owner = { OwnerName: element };
          model.PropertyOwners.push(owner);
        });
      } else {
        model.PropertyOwners.push({ OwnerName: '' });
      }

      if (typeof row[28] === 'number') {
        model.LienDate = row[28]
          ? moment(
            new Date(Math.round((row[28] - 25569) * 86400 * 1000)),
          ).format('YYYY-MM-DD')
          : '';
      } else if (typeof row[28] === 'string') {
        model.LienDate = row[28] ? moment(row[28]).format('YYYY-MM-DD') : '';
      };
      break;
  }
  return model;
};
