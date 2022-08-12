module.exports = class TrustMasterModel {

    constructor(TrustName,
        RegistrationORNondhniNo,
        RegistrationDate,
        TrustAddress,
        TrustEmailId,
        TrustPhoneNo,
        ProcessAppointmentTrustee) {

        this.TrustName = TrustName;
        this.RegistrationORNondhniNo = RegistrationORNondhniNo;
        this.RegistrationDate = RegistrationDate;
        this.TrustAddress = TrustAddress;
        this.TrustEmailId = TrustEmailId;
        this.TrustPhoneNo = TrustPhoneNo;
        this.ProcessAppointmentTrustee = ProcessAppointmentTrustee;
    }
}