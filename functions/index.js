const functions = require("firebase-functions");

const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
const googleSheet = require("./google-sheet.json");

admin.initializeApp({
  credential: admin.credential.cert({
    privateKey: serviceAccount.private_key,
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
  }),
  databaseURL: "https://vihicle-afc3a.firebaseio.com/",
});

const { google } = require("googleapis");
const sheets = google.sheets("v4");

const jwtClient = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"], // read and write sheets
});

const key = ["RPM", "Velocity", "Temp", "engine", "Throttle"];
const sheetName = "Vehicle";
const columnNameList = [
  sheetName.concat("!A"),
  sheetName.concat("!B"),
  sheetName.concat("!C"),
  sheetName.concat("!D"),
  sheetName.concat("!E"),
];
const columnNameEndList = [":A", ":B", ":C", ":D", ":E"];

exports.copyDataToSheet = functions.database
  .ref("/")
  .onWrite(async (created, context) => {
    let data = created.after.val();
    key.forEach((key, index) => {
      const dataByColumn = data[key];
      if (dataByColumn) {
        var lastKey = Object.keys(dataByColumn)[
          Object.keys(dataByColumn).length - 1
        ];
        const recentlyData = dataByColumn[lastKey];
        let score;
        console.log(key, index);
        switch (key) {
          case "RPM":
            score = calculateRPMScore(recentlyData);
            break;
          case "Velocity":
            score = calculateVelocityScore(recentlyData);
            break;
          case "Temp":
            score = calculateTempurtureScore(recentlyData);
            break;
          case "engine":
            score = calculateEngineScore(recentlyData);
            break;
          case "Throttle":
            score = calculateThrottleScore(recentlyData);
            break;
          default:
            score = 1;
            break;
        }
        sendToGoogleSheet(score, index);
      }
    });
  });

async function sendToGoogleSheet(data, index) {
  await jwtClient.authorize();
  const dataOnSheet = await getDataOnSheet();

  const request = createGoogleSheetRequest(data, index, dataOnSheet);

  await sheets.spreadsheets.values.update(request, {});
}

async function getDataOnSheet() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: googleSheet.spreadsheetId,
    auth: jwtClient,
    range: `${columnNameList[0]}1${columnNameEndList[4]}`,
  });
  return response.data.values;
}

function createGoogleSheetRequest(data, columnIndex, dataOnSheet) {
  let lastRow = dataOnSheet.length + 1;
  return {
    auth: jwtClient,
    spreadsheetId: googleSheet.spreadsheetId,
    range: `${columnNameList[columnIndex]}${lastRow}${columnNameEndList[columnIndex]}${lastRow}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[data]],
    },
  };
}

function calculateVelocityScore(velocity) {
  return velocity >= 160 ? 1 : velocity >= 130 ? 2 : velocity >= 110 ? 3 : 4;
}

function calculateTempurtureScore(tempurture) {
  console.log(tempurture >= 100);
  return tempurture >= 100
    ? 1
    : tempurture >= 95
    ? 2
    : tempurture >= 90
    ? 3
    : 4;
}

function calculateRPMScore(rpm) {
  return rpm >= 4800 ? 1 : rpm >= 3800 ? 2 : rpm >= 2800 ? 3 : 4;
}

function calculateEngineScore(engine) {
  return engine >= 61 ? 1 : engine >= 51 ? 2 : engine >= 41 ? 3 : 4;
}

function calculateThrottleScore(throttle) {
  return throttle >= 61 ? 1 : throttle >= 51 ? 2 : throttle >= 41 ? 3 : 4;
}
