var controllers = [];

controllers.push(require('./controllers/User'));
controllers.push(require('./controllers/Property'));
controllers.push(require('./controllers/PropertyLegalCase'));
controllers.push(require('./controllers/PropertyLegalcaseHearing'));
controllers.push(require('./controllers/PropertyTax'));
controllers.push(require('./controllers/SignUP'));
controllers.push(require('./controllers/Login'));
controllers.push(require('./controllers/S3Try')); // Temp
controllers.push(require('./controllers/PropertyDocument'));
controllers.push(require('./controllers/Property_PhotoVideo'));
controllers.push(require('./controllers/PropertyOnlyDocument'));
controllers.push(require('./controllers/State'));
controllers.push(require('./controllers/Area'));
controllers.push(require('./controllers/PropertyType'));
controllers.push(require('./controllers/Dropdown'));
controllers.push(require('./controllers/PropertyRent'));
controllers.push(require('./controllers/Lawyer'));
controllers.push(require('./controllers/PropertyLegalCaseActs'));
controllers.push(require('./controllers/PropertyLegalcase_Petitionet_Respondent_lawyer.js'))
controllers.push(require('./controllers/Dashboard'));
controllers.push(require('./controllers/PropertyTaxType'));
controllers.push(require('./controllers/PropertyTenant'));
controllers.push(require('./controllers/CompanyMaster'));
controllers.push(require('./controllers/PublicNotice'));
controllers.push(require('./controllers/TItleClearCertificate'));
controllers.push(require('./controllers/Property_RoleBase'));
controllers.push(require('./controllers/PropertyTax_Rolebase'));
controllers.push(require('./controllers/PropertyRent_Rolebase'));
controllers.push(require('./controllers/PropertyLegalCase_Rolebase'));
controllers.push(require('./controllers/PropertyLegalCaseDocument'));
controllers.push(require('./controllers/TrustMaster'));
controllers.push(require('./controllers/TrustMeeting'));
controllers.push(require('./controllers/TrustFund'));
controllers.push(require('./controllers/TrustAudit'));
controllers.push(require('./controllers/TrustExemCertificate'));
controllers.push(require('./controllers/TrustITReturn'));
controllers.push(require('./controllers/TrustDocument'));
controllers.push(require('./controllers/LoanApplicationBulkUpload'));
controllers.push(require('./controllers/GetLoanPVRDetails'));
controllers.push(require('./controllers/GetMappingaiIPVR'));



// Reminder
controllers.push(require('./Reminder/PropertyTaxReminder'));
controllers.push(require('./Reminder/PropertyRentReminder'));
controllers.push(require('./Reminder/PropertyLegalCaseReminder'));
controllers.push(require('./Reminder/TrustMeetingReminder'));
controllers.push(require('./Reminder/TrustITReturnReminder'))
controllers.push(require('./Reminder/TrustFundReminder'))
controllers.push(require('./Reminder/TrustExemptionCertificateReminder'))
controllers.push(require('./Reminder/TrustAuditReminder'))
    // Notification
controllers.push(require('./Notification/PropertyTaxNotification'));
controllers.push(require('./Notification/PropertyRentNotification'));
controllers.push(require('./Notification/LegalCaseNotification'));
controllers.push(require('./Notification/TrustMeetingNotification'))
controllers.push(require('./Notification/TrustAuditNotification'));
controllers.push(require('./Notification/TrustFundNotification'));
controllers.push(require('./Notification/TrustITReturnNotification'));
controllers.push(require('./Notification/TrustExeptionCrtiNotification'))

// Bank Module
controllers.push(require('./controllers/LoanApplication'));
controllers.push(require('./controllers/LoanTypes'));
controllers.push(require('./controllers/LoanApplicationDocument'));
controllers.push(require('./controllers/LoanPVR'));
controllers.push(require('./controllers/LoanDashboard'));
controllers.push(require('./controllers/BankMaster'));
controllers.push(require('./controllers/LoanAssignLawyer'));
controllers.push(require('./controllers/UserState_permission'));

// Deom
controllers.push(require('./controllers/ForDemoLoanPropertyDocument'))

// Error
controllers.push(require('./controllers/NOTFound'));

module.exports = controllers;