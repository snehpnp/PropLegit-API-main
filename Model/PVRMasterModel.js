module.exports = class PVRMasterModel {

    constructor(TotalLandSize,
        OwnerRemarks,
        PropertyRemarks,
        EncumbranceRemarks,
        PVRPropertyStatus,
        PVRRiskMeterStatus,
        PVRStatusLine1,
        PVRStatusLine2,
		NumberOfOwners,
		government,
		governmentFound) {

        this.TotalLandSize = TotalLandSize
        this.OwnerRemarks = OwnerRemarks
        this.PropertyRemarks = PropertyRemarks
        this.PVRPropertyStatus = PVRPropertyStatus
        this.EncumbranceRemarks = EncumbranceRemarks
        this.PVRRiskMeterStatus = PVRRiskMeterStatus
        this.PVRStatusLine1 = PVRStatusLine1
        this.PVRStatusLine2 = PVRStatusLine2
		this.NumberOfOwners = NumberOfOwners
		this.government = government
		this.governmentFound = governmentFound

    }

}