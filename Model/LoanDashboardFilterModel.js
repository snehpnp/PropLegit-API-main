module.exports = class LoanDashboardFilterModel {

    constructor(FilterStartDate,
        FilterEndDate,
        TypeOfLoan,
        LoanPropertyTypeID,
        ApplicationStatus,
        UserID,
        CompanyUserMasterID
    ) {

        this.FilterStartDate = FilterStartDate;
        this.FilterEndDate = FilterEndDate;
        this.TypeOfLoan = TypeOfLoan;
        this.LoanPropertyTypeID = LoanPropertyTypeID;
        this.ApplicationStatus = ApplicationStatus;
        this.UserID = UserID;
        this.CompanyUserMasterID = CompanyUserMasterID

    }

}