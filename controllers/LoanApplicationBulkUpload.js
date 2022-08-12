const router = require('express').Router();
const SqlString = require('sqlstring');
const sql = require('mssql');
const xlsx = require('xlsx');
const multer = require('multer');
const CurrentDateTime = require('../shared/CurrentDateTime');
const {
  runStoredProcedure,
  runStoredProcedureOutput,
  executeQuery,
} = require('../MsSql/Query');
const APIErrorLog = require('../Text Log/AddErrorLogintoText.js');
let LoanApplicationModel = require('../Model/BulkUploadLoanApplicationModel');
let ResponseModel = require('../Model/ResponseModel');
let modelBuilder = require('../helpers/modelBuilder');
const getHeader = require('../helpers/getHeader');
const trimArray = require('../helpers/trimArray');
const getModel = require('../helpers/setDynamicModel');
const IdmModelValidator = require('../helpers/getIdModel');
const check = require('../helpers/Validator');
const getValidatorModel = require('../helpers/getModelValidator');
const { json } = require('body-parser');


const spAddLoanApplication = `sendbox_sp_Post_LoanApplication`;
const tblpropertyowner = 'tbl_PropertyOwnerShip';

const upload = multer({
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ==
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      // return cb(new Error('Only .excel format allowed!'));
    }
  },
}).single('uploadfile');

let POSTBulkUpload = async (req, res) => {
  try {
    const { file } = { ...req };
    const { CreatedBy } = { ...req.body };
    const { stateID } = { ...req.params };
    if (!file) {
      var errMessage = `please upload only 1 excel file.`;
      return res
        .status(200)
        .send(
          new modelBuilder().buildModel(
            { status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage },
            new ResponseModel(),
          ),
        );
    }
    const dt = await xlsx.read(file.buffer);
    const first_worksheet = dt.Sheets[dt.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(first_worksheet, { header: 1 });
    let header = trimArray(data[0]);
    let headerColumns = trimArray(getHeader(stateID));
    //  res.send({header,headerColumns})
    if (
      JSON.stringify(header).toLocaleLowerCase() !==
      JSON.stringify(headerColumns).toLowerCase()
    ) {
      var errMessage = `Invalid excel header.`;
      return res
        .status(200)
        .send(
          new modelBuilder().buildModel(
            { status: 412, error_code: 'INVALID_REQ_DATA', error: errMessage },
            new ResponseModel(),
          ),
        );
    }
    let response = [];
    for (let index = 1; index < data.length; index++) {
      if (data[index].every((x) => x === undefined)) {
        continue;
      }
      try {
        const currrow = trimArray(data[index]);
        const obj = getModel(stateID, currrow);
        const validatorModel = getValidatorModel(stateID, obj);
        const resmatch = await check(obj, validatorModel);
        console.log(resmatch);
        if (!resmatch.matched) {
          response.push({
            row: index,
            success: false,
            message: resmatch.Message,
          });
          continue;
        }

        let {
          StateName,
          DistrictName,
          TalukaName = null,
          VillageName = null,
          HobliName = null,
          TypeOfLoan = null,
          Region = null,
          TSULBName = null,
          TSCircleName = null,
          MandalName = null,
          TNTown = null,
          TNWard = null,
          TNBlock = null,
          ZoneName = null,
          BlockName = null,
          GramPanchayatName = null,
          CorporationMunicipalityNP = null,
          PropertyType = null,
          CitySurveyOfficeName = null,
          WardName = null,
        } = await { ...obj };

        let modelids;
        let Outputmodel;
        let spViewApplicationAllID;
        switch (stateID) {
          case '7':
            //Gujrat
            modelids = await {
              StateName,
              DistrictName,
              TalukaName,
              VillageName,
              LoanType: TypeOfLoan,
              LoanPropertyType: PropertyType,
              CitySurveyOfficeName,
              Ward: WardName,
            }
            Outputmodel = await {
              StateID: null,
              DistrictID: null,
              TalukaID: null,
              VillageID: null,
              BankID: null,
              TypeOfLoan: null,
              LoanPropertyTypeID: null,
              CitySurveyOfficeID: null,
              WardID: null
            }
            spViewApplicationAllID = 'sp_View_Gujarat_Application_AllID';
            break;

          case '22':
            //Rajasthan
            modelids = await {
              StateName,
              DistrictName,
              TalukaName,
              VillageName,
              LoanType: TypeOfLoan,
              LoanPropertyType: PropertyType,
            }
            Outputmodel = await {
              StateID: null,
              DistrictID: null,
              TalukaID: null,
              VillageID: null,
              BankID: null,
              TypeOfLoan: null,
              LoanPropertyTypeID: null,
            }
            spViewApplicationAllID = 'sp_View_Rajashthan_Application_AllID';
            break;

          case '15':
            //Maharashtra
            modelids = await {
              StateName,
              DistrictName,
              TalukaName,
              VillageName,
              Region,
              LoanType: TypeOfLoan,
              LoanPropertyType: PropertyType,
              CitySurveyOfficeName
            }
            Outputmodel = await {
              StateID: null,
              DistrictID: null,
              TalukaID: null,
              VillageID: null,
              BankID: null,
              RegionID:null,
              TypeOfLoan: null,
              LoanPropertyTypeID: null,
              CitySurveyOfficeID: null
            }
            spViewApplicationAllID = 'sp_View_Maharashtra_Application_AllID';
            break;

          case '12':
            // Karnataka
            modelids = await {
              StateName,
              DistrictName,
              TalukaName,
              VillageName,
              BlockName,
              GramPanchayatName,
              HobliName,
              LoanType: TypeOfLoan,
              LoanPropertyType: PropertyType,
            }
            Outputmodel = await {
              StateID: null,
              DistrictID: null,
              TalukaID: null,
              VillageID: null,
              BankID: null,
              BlockID: null,
              GramPanchayatID: null,
              TypeOfLoan: null,
              HobliID: null,
              LoanPropertyTypeID: null,
            }
            spViewApplicationAllID = 'sp_View_Karnataka_Application_AllID';
            break;

          case '24':
            //Tamil Nadu 
            modelids = await {
              StateName,
              DistrictName,
              TalukaName,
              VillageName,
              TNTown,
              TNWard,
              TNBlock,
              LoanType: TypeOfLoan,
              LoanPropertyType: PropertyType,
            }
            Outputmodel = await {
              StateID: null,
              DistrictID: null,
              TalukaID: null,
              VillageID: null,
              TNTownID:null,
              TNWardID:null,
              TNBlockID:null,
              BankID: null,
              TypeOfLoan: null,
              LoanPropertyTypeID: null
            }
            spViewApplicationAllID = 'sp_View_Tamilnadu_Application_AllID';
            break;

          case '25':
            //Telangana
            modelids = await {
              StateName,
              DistrictName,
              TalukaName: MandalName,
              VillageName,
              TSULBName,
              TSCircleName,
              LoanType: TypeOfLoan,
              LoanPropertyType: PropertyType,
            }
            Outputmodel = await {
              StateID: null,
              DistrictID: null,
              TalukaID: null,
              VillageID: null,
              TSULBID: null,
              TSCircleID: null,
              BankID: null,
              TypeOfLoan: null,
              LoanPropertyTypeID: null,
            }
            spViewApplicationAllID = 'sp_View_Telangana_Application_AllID';
            break;
          default:
            break;
        }
        let outputParams = [];
        let inputparams = [];
        await Object.keys(modelids).forEach((element) => {
          inputparams.push({
            name: element,
            type: sql.NVarChar,
            value: modelids[element] ? modelids[element] : null,
          });
        });
        Object.keys(Outputmodel).forEach((element) => {
          outputParams.push({
            name: element,
            type: sql.NVarChar,
            value: modelids[element] ? modelids[element] : null,
          });
        });
        // console.log(inputparams);
        const resultoutput = await runStoredProcedureOutput(
          spViewApplicationAllID,
          inputparams,
          outputParams,
        );
        const ALLLIDdata = await resultoutput.output;
        console.log(ALLLIDdata, "ALLLIDdata");
        const idValidator = IdmModelValidator(stateID, obj);
        const matchedresult = await check(ALLLIDdata, idValidator);

        if (!matchedresult.matched) {
          response.push({
            row: index,
            success: false,
            message: matchedresult.Message,
          });
          continue;
        }
        let loanmodel = new LoanApplicationModel({ ...obj, ...ALLLIDdata });
        // console.log(loanmodel);
        loanmodel.CreatedBy = CreatedBy;
        loanmodel.CreatedAt = CurrentDateTime();
        loanmodel.IpAddress = req.myCustomAttributeName;

        let finalinputparams = [];

        Object.keys(loanmodel).forEach((element) => {
          finalinputparams.push({
            name: element,
            type: sql.NVarChar,
            value: loanmodel[element] ? loanmodel[element] : null,
          });
        });
        // console.log(finalinputparams,"finalinputparams");

        try {
          const LoanResult = await runStoredProcedure(
            spAddLoanApplication,
            finalinputparams,
          );
          let resultData = LoanResult.recordset[0];
          let { PropertyID, AppID, CreatedAt } = { ...resultData };

          let PropertyOwners = obj.PropertyOwners ? obj.PropertyOwners : null;

          if (!PropertyOwners) {
            response.push({
              row: index,
              success: true,
              message: 'Loan application successfully submitted',
            });
            continue;
          }

          let tempArray = [];
          let MsSqlQuery = '';

          const tempQuery = () => {
            return new Promise((resolve, reject) => {
              PropertyOwners.forEach((element) => {
                MsSqlQuery += SqlString.format(
                  `INSERT INTO ${tblpropertyowner}(PropertyID, OwnerName) VALUES (?, ?);`,
                  [
                    PropertyID,
                    typeof element.OwnerName == 'string'
                      ? element.OwnerName.trim()
                      : element.OwnerName,
                  ],
                );

                tempArray.push(element);
                if (tempArray.length === PropertyOwners.length)
                  resolve(MsSqlQuery);
              });
            });
          };

          let Query = await tempQuery();
          const ownerResult = await executeQuery(Query);
          response.push({
            row: index,
            success: true,
            message: 'Loan application successfully submitted',
          });
        } catch (err) {
          console.log(err);
          let errMessage = `An error occurred during Add Loan Application`;
          APIErrorLog(
            spAddLoanApplication,
            err,
            req.headers,
            req.body,
            errMessage,
            req.method,
            req.params,
            req.query,
          );
          response.push({
            row: index,
            success: false,
            message: errMessage,
          });
        }
      } catch (err) {
        console.log(err);
        response.push({
          row: index,
          success: false,
          message: 'An error occurred during Add Loan Application',
        });
      }
    }

    res.status(200).send(
      new modelBuilder().buildModel(
        {
          status: 200,
          data: response,
          message: 'File Uploaded Successfully',
        },
        new ResponseModel(),
      ),
    );
  } catch (err) {
    console.log(err);
    let errMessage = `An error occurred during Fetch Loan Application ALL requied ID`;
    APIErrorLog(
      spViewApplicationAllID,
      err,
      req.headers,
      req.body,
      errMessage,
      req.method,
      req.params,
      req.query,
    );
    return res
      .status(500)
      .send(
        new modelBuilder().buildModel(
          { status: 500, error_code: 'SERVER_ERROR', error: errMessage },
          new ResponseModel(),
        ),
      );
  }
};

router.post('/api/loan/application/excel/:stateID', upload, POSTBulkUpload);
module.exports = router;
