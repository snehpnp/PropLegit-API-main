const GetEmailAttachmentBuffer = require('../shared/GetEmailAttachmentBuffer');
const {
    MssqldatetimeFormat,
    CurrentdatetimeFormat,
} = require('../shared/datetimeFormat');
const CurrentDateTime = require('../shared/CurrentDateTime');
const SaveDocumentGetDocumentID = require('../shared/SaveDocumentGetDocumentID');

const { merge } = require('merge-pdf-buffers');

// Sql DB info
const PDFEmailAttachmentID = 4;
const LoanPVRDocumentID = 17;

var GenrateAndStordPVRDocument = (objmy, merged = []) => {
    return new Promise(async (resolve, reject) => {
        try {
            var dataoject = await {
                ApplicationID: objmy.ApplicationID,
                AppID: objmy.AppID,
                CreatedAt: MssqldatetimeFormat(objmy.CreatedAt, 'MMMM Do YYYY'),
                Todaydate: CurrentdatetimeFormat(
                    CurrentDateTime(),
                    'MMMM Do YYYY',
                ),
                FirstName: objmy.FirstName,
                LastName: objmy.LastName,
                PVROwnerDetails: objmy.PVROwnerDetails,
                PropertyID: objmy.PropertyID,
                Loan_Property_Type: objmy.Loan_Property_Type,
                PropertyRemarks: objmy.PropertyRemarks,
                PostalAddress: objmy.PostalAddress,
                OwnerRemarks: objmy.OwnerRemarks,
                SurveyNo: objmy.SurveyNo || objmy.SurveyGatNo || objmy.KhasraNo,
                TotalLandSize: objmy.TotalLandSize,
                VillageName: objmy.VillageName,
                HobliName: objmy.HobliName,
				HalkaName: objmy.HalkaName,
                TPNo: objmy.TPNo,
                Loan_Property_Type: objmy.Loan_Property_Type,
                TalukaName: objmy.TalukaName,
                FPNo: objmy.FPNo,
                DistrictName: objmy.DistrictName,
                StateName: objmy.StateName,
                PropertyRemarks: objmy.PropertyRemarks,
                EncumbranceRemarks: objmy.EncumbranceRemarks,
                PVRPropertyStatus: objmy.PVRPropertyStatus,
                PVRRiskMeterStatus: objmy.PVRRiskMeterStatus,
                PVRStatusLine1: objmy.PVRStatusLine1,
                PVRStatusLine2: objmy.PVRStatusLine2,
                BaseDocumentType: objmy.BaseDocumentType,
                Khata_No: objmy.Khata_No,
				PattaNo: objmy.PattaNo,
				SubDivisionNo: objmy.SubDivisionNo,
				SurnocNo: objmy.SurnocNo,
				CitySurveyNo: objmy.CitySurveyNo,
                CitySurveyOffice: objmy.CitySurveyOfficeName,
                CityWardNo: objmy.CityWardNo,
                CityWardName: objmy.WardName,
                SheetNumber: objmy.SheetNumber,
                BuildingNo: objmy.BuildingNo,
                BuildingName: objmy.BuildingName,
                HissaNo: objmy.HissaNo,
				RegionName: objmy.RegionName,
				PlotNo:objmy.PlotNo,
				KhewatNo:objmy.KhewatNo,
				SubDivisionName:objmy.SubDivisionName,
				CircleName: objmy.CircleName,
				governmentFound: objmy.governmentFound,
				government: objmy.government,
				NumberOfOwners: objmy.NumberOfOwners
            }
            // console.log(dataoject,"dataoject");
            var pdfBuffer = await GetEmailAttachmentBuffer(dataoject, PDFEmailAttachmentID);

            var filearray = [];
            await filearray.push(pdfBuffer);
            filearray = await filearray.concat(merged);

            const mergedpdfBuffer = await merge(filearray);

            var model = await {
                PropertyID: dataoject.PropertyID,
                DocumentTypeId: LoanPVRDocumentID,
                DocumentSubTypeId: null,
                FileExistenceCheck: 0,
                IpAddress: null,
                FileName: `PVR_Documnet_${dataoject.AppID}.PDF`,
                FileType: `PDF`,
                Description: `Auto Generated PVR Document`,
                UserID: null,
                CreatedBy: 1,
            };
            var response = await SaveDocumentGetDocumentID(model, {
                buffer: mergedpdfBuffer,
            });

            resolve(response);
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = GenrateAndStordPVRDocument;
