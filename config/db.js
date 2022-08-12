const sql = require('mssql');

// SQL SERVER
const Pool = new sql.ConnectionPool({
  // server: 'mssql.ccvafvfboode.ap-south-1.rds.amazonaws.com',
  // user: 'dotnet_dev',
  // password: 'Dotnet@2021',
  // database: 'proplegit-dev',
  // port: 14251,
  server: 'mssql.esmsys.in',
  user: 'esmsysqadb',
  password: 'esmsys-20%20',
  // database: 'proplegit-test',
  database: 'proplegit-qa',
  port: 14251,
  options: {
    encrypt: false, // Use this if you're on Windows Azure,
    enableArithAbort: true
  }
})

var Toggle = {
  // Error mode in text file
  CallLogMode: true,
  ErrorLogMode: true,
  SecurityMode: false
}

var EmailAuthcredentials = {
  user: "mail@esmsys.com",
  pass: "Tam18448"
}

var smscountry = {
  User: "esmsys",
  passwd: "Esmsys@Amd2014"
}

// OTP Email - Admin => Client
var OTPEmail = {
  // From: 'pooja.joshi@esmsys.com',
  // BCC: ['pooja.joshi@esmsys.com']
  From: 'mail@esmsys.com',
  BCC: ['dotnettest@esmsys.com','jay.patel@esmsys.com','vimal.damor@jahernotice.com','varun.patel@jahernotice.com']
}

// OTP SMS - Admin => Client
var OTPSMS = {
  sid: 'PRPLGT'
}

// Aazon S3 Bucket
AazonS3Bucket = {
  ACCESSKEYID: 'AKIAWT3IPMEXJVFNDCPS',
  SECRETACCESSKEY: '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',
  BUCKETNAME: 'proplegitqa'
}

const internal_team_of_LoanApp = {
  Email: ['vimal.damor@jahernotice.com'],
  SMS: []
}

module.exports = {
  Toggle, Pool, EmailAuthcredentials, OTPEmail, smscountry, OTPSMS, AazonS3Bucket, internal_team_of_LoanApp
}