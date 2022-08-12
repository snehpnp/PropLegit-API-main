class LawyerModel{
    constructor(LawyerName,Firm,MobileNo,LandlineNo,Fax,EmailId,Website,Address,
        VillageId,TalukaId,DistrictId,City,PinCode){

            this.LawyerName=LawyerName;
            this.Firm=Firm;
            this.MobileNo=MobileNo;
            this.LandlineNo=LandlineNo;
            this.Fax=Fax;
            this.EmailId=EmailId;
            this.Website=Website;
            this.Address=Address;
            this.VillageId=VillageId;
            this.TalukaId=TalukaId;
            this.DistrictId=DistrictId;
            this.City=City;
            this.PinCode=PinCode;
    }
}
module.exports=LawyerModel;