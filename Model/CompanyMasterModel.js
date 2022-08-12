module.exports = class CompanyMasterModel{

    constructor(CompanyName,
                CompanyDescription,
                CompanyLogo){

        this.CompanyName = CompanyName == undefined ? null : CompanyName,
        this.CompanyDescription = CompanyDescription == undefined ? null : CompanyDescription
        this.CompanyLogo = CompanyLogo
    }
}