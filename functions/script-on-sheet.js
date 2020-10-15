const sourceSpreadsheet = SpreadsheetApp.getActive();
const dataSheet = sourceSpreadsheet.getSheets()[0];

function checkVehicleStop() {
  let lastRow = dataSheet.getLastRow()

  if(lastRow <= 12) {
    let scores = dataSheet.getRange("A2:E").getValues();
    let zeroScoreList = scores.filter((row) => row.reduce((prev, current) => prev + current) === 0);
    if(zeroScoreList.length >= 1) {
      createRedarChartAndGeneratePdf();
    }
  } else {
    let lastRowScores = dataSheet.getRange(`A${lastRow}:E${lastRow}`).getValues();
    if(lastRowScores[0].reduce((prev, current) => prev + current) === 0) {
      createRedarChartAndGeneratePdf();
    }
  }
}

function createRedarChartAndGeneratePdf() {
  
  let lastRow = filterDataAndGetLastRow();
  let averageScore = getAverageScore(lastRow);
  setAverageScore(averageScore.map(score => [score]));
  
  generateRadarChart();
  
  generatePdf();
  
  clearData();
  deleteCharts();
}

function filterDataAndGetLastRow() {
  let scoreList = dataSheet.getRange("A2:E").getValues();
  let filterScore = scoreList.filter((row) => row.findIndex((score) => score === '' || score === 0) === -1);
  
  clearData();

  dataSheet.getRange(`A2:E${filterScore.length + 1}`).setValues(filterScore);
  return filterScore.length
}

function clearData() {
  dataSheet.getRange("A2:E").clear();
  dataSheet.getRange("I2:I6").clear();
}

function getAverageScore(lastRow) {
  let scoreList = dataSheet.getRange(`A2:E${lastRow + 1}`).getValues();
  let sumScores = scoreList.reduce((prev, current, currentIndex) =>  current.map((score, index) =>  score + prev[index]));
  let averageScore = sumScores.map(score => Math.ceil(score / scoreList.length));
  return averageScore;
}

function setAverageScore(avgScore) {
  let cellSetAverageScoreRange = dataSheet.getRange("I2:I6")
  cellSetAverageScoreRange.setValues(avgScore)
}

function generateRadarChart() {
  let chartBuilder = dataSheet.newChart();
  chartBuilder
  .addRange(dataSheet.getRange("H2:H6"))
  .addRange(dataSheet.getRange("I2:I6"))
  .setChartType(Charts.ChartType.RADAR)
  .setNumHeaders(0)
  .setOption('title', 'Scores')
  .setOption("useFirstColumnAsDomain", true)
  .setOption("colors",["#e0296c"])
  .setOption('width', 700)
  .setOption('height', 600)
  .setPosition(1,1,0,0)
  .setOption('vAxis.gridlines.count', 4)
  .setOption('series', {  0: { lineWidth: 1, pointSize: 5},
                        1: { lineDashStyle: [4, 4] },
                        2: { lineDashStyle: [4, 4] }
                        })
  dataSheet.insertChart(chartBuilder.build());
}


function generatePdf() {
  const lastRow = 30
  
  // Set the output filename as SheetName.
  const pdfName = `VehicleScore_${new Date().toISOString()}`

  // Get folder containing spreadsheet to save pdf in.
  let parents = DriveApp.getFileById(sourceSpreadsheet.getId()).getParents();
  if (parents.hasNext()) {
    var folder = parents.next();
  }
  else {
    folder = DriveApp.getRootFolder();
  }
  
  // Copy whole spreadsheet.
  let destSpreadsheet = SpreadsheetApp.open(DriveApp.getFileById(sourceSpreadsheet.getId()).makeCopy("tmp_convert_to_pdf", folder))

  // Delete redundant sheets.
  let sheets = destSpreadsheet.getSheets();
  for (i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetName() != "Vehicle"){
      destSpreadsheet.deleteSheet(sheets[i]);
    }
  }
  
  let destSheet = destSpreadsheet.getSheets()[0];

  // Repace cell values with text (to avoid broken references).
  let sourcevalues = dataSheet.getRange(1,1,lastRow,dataSheet.getMaxColumns()).getValues();
  var destRange = destSheet.getRange(1, 1, lastRow, destSheet.getMaxColumns());
  destRange.setValues(sourcevalues);

  // Save to pdf.
  var theBlob = destSpreadsheet.getBlob().getAs('application/pdf').setName(pdfName);
  var newFile = folder.createFile(theBlob);

  // Delete the temporary sheet.
  DriveApp.getFileById(destSpreadsheet.getId()).setTrashed(true);
}

function deleteCharts() {
  let charts = dataSheet.getCharts();
  charts.forEach((chart) => dataSheet.removeChart(chart));
}