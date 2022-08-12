class SignUPModel {

    constructor(EmailAddress,
                    Password,
                    FirstName,
                    LastName,
                    MobileNumber,
                    StateID){

    this.EmailAddress = EmailAddress;
    this.Password = Password;
    this.FirstName = FirstName;
    this.LastName = LastName;
    this.MobileNumber = MobileNumber;
    this.StateID = StateID;

    }
}


module.exports = SignUPModel;