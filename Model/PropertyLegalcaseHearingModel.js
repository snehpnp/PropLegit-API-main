class PropertyLegalcaseHearingModel {

    constructor(LegalCaseID,
        HearingDate,
        Judge,
        CourtName,
        CourtNumber,
        CourtAddress) {

        this.LegalCaseID = LegalCaseID;
        this.HearingDate = HearingDate;
        this.Judge = Judge;
        this.CourtName = CourtName;
        this.CourtNumber = CourtNumber;
        this.CourtAddress = CourtAddress;
    }

}

module.exports = PropertyLegalcaseHearingModel;