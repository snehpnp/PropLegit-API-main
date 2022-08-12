const niv = require('node-input-validator');

const RegIndianMobNO = `^((\+){0,1}91(\s){0,1}(\-){0,1}(\s){0,1}){0,1}98(\s){0,1}(\-){0,1}(\s){0,1}[1-9]{1}[0-9]{7}$`;

niv.addCustomMessages({
  'BaseDocumentType.CheckBaseDocumentType':
    'Please enter value for Base Document Type is 712 or PropertyCard.',
  'SurveyNo.required': 'Please enter Survey number.',
  'DistrictID.required': 'Please enter only valid District name.',
  'TalukaID.required': 'Please enter only valid Taluka name.',
  'VillageID.required': 'Please enter only valid Village name.',
  'LoanPropertyTypeID.required': 'Please enter valid Land Property Type.',
  'TypeOfLoan.required': 'Please enter valid Loan Type.',
  'LoanAmount.min': 'Please enter Loan amount greater than zero.',
  'LienAmount.min': 'Please enter Lien amount greater than zero.',
});

niv.extend('CheckBaseDocumentType', ({ value }) => {
  if (
    value == '7/12' ||
    value == '712' ||
    value.toLowerCase() == 'propertycard'
  ) {
    return true;
  }
  return false;
});

niv.extend('MobileCheck', ({ value }) => {
  return /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/.test(value);
});

niv.extend('Date', ({ value }) => {
  if (new Date(value)) {
    return true;
  }
  return false;
});

const check = async (dataobj, modelobj) => {
  return new Promise(async (resolve, reject) => {
    try {
      let v = new niv.Validator(dataobj, modelobj);
      let matched = await v.check();
      var arrayMessage = [];

      if (!v.errors) resolve({ matched, Message: null });

      const messagePromess = () => {
        return new Promise(async (resolve, reject) => {
          var tempArray = Object.keys(v.errors);

          if (tempArray.length === 0) resolve(arrayMessage);
          tempArray.forEach((e) => arrayMessage.push(v.errors[e].message));

          if (tempArray.length === arrayMessage.length) resolve(arrayMessage);
        });
      };

      const callmessagePromess = await messagePromess();

      resolve({ matched, Message: arrayMessage.join(' ') });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = check;
