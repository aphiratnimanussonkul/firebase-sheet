const functions = require("firebase-functions");

var admin = require("firebase-admin");
var serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert({
    privateKey: serviceAccount.private_key,
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
  }),
  databaseURL: "https://vihicle-afc3a.firebaseio.com/",
});

// const { google } = require("googleapis");
// const sheets = google.sheets("v4");

// const jwtClient = new google.auth.JWT({
//   email: serviceAccount.client_email,
//   key: serviceAccount.private_key,
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"], // read and write sheets
// });

exports.copyDataToSheet = functions.database
  .ref("/")
  .onUpdate(async (change) => {
    let data = change.after.val();
    data.forEach((element) => {
      console.log(element);
    });
    // var lastKey = Object.keys(data)[Object.keys(data).length - 1];
  });
