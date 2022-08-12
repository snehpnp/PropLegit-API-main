class PropertyTaxModel{

    constructor(PropertyTaxId,
                FinancialTaxYear,
                AmountDue,
                DueDate,
                ModifiedBy
                 ){
    
        this.PropertyTaxId = PropertyTaxId,
        this.FinancialTaxYear = FinancialTaxYear,
        this.AmountDue = AmountDue,
        this.DueDate = DueDate,
        this.ModifiedBy = ModifiedBy
    }

}

module.exports = PropertyTaxModel;