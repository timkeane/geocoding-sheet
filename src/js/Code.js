/*version*/
var ADDON_NAME = 'Geocoder';
var ERROR_COLOR = '#FFA500';
var CORRECTED_COLOR = '#ADFF2F';
var LOCATION_NAME_COL = 'LOCATION_NAME';
var LONGITUDE_COL = 'LNG';
var LATITUDE_COL = 'LAT';
var PROJECTED_X_COL = 'X';;
var PROJECTED_Y_COL = 'Y'

function onInstall() {
  onOpen();
}

function onOpen() {
  SpreadsheetApp.getUi().createAddonMenu().addItem(ADDON_NAME, 'show').addToUi();
}

function show() {
  var html = HtmlService.createTemplateFromFile('index').evaluate().setTitle(ADDON_NAME);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getData() {
  return SpreadsheetApp.getActiveSheet().getDataRange().getValues();
}

function standardCols(sheet, data) {
  var length = data.cells.length;
  var range = sheet.getRange(1, 1, 1, length);
  var columns = range.getValues()[0];
  var nameCol = columns.indexOf(LOCATION_NAME_COL);
  var lngCol = columns.indexOf(LONGITUDE_COL);
  var latCol = columns.indexOf(LATITUDE_COL);
  nameCol = (nameCol > -1) ? (nameCol + 1) : (length + 1);
  lngCol = (lngCol > -1) ? (lngCol + 1) : (length + 2);
  latCol = (latCol > -1) ? (latCol + 1) : (length + 3);
  sheet.getRange(1, nameCol).setValue(LOCATION_NAME_COL);
  sheet.getRange(1, lngCol).setValue(LONGITUDE_COL);
  sheet.getRange(1, latCol).setValue(LATITUDE_COL);
  return xyCols(sheet, data, {name: nameCol, lng: lngCol, lat: latCol});
}

function xyCols(sheet, data, standardCols) {
  if (data.projected) {
    var length = data.cells.length;
    var range = sheet.getRange(1, 1, 1, length);
    var columns = range.getValues()[0];
    var xCol = columns.indexOf(PROJECTED_X_COL);
    var yCol = columns.indexOf(PROJECTED_Y_COL);
    xCol = (xCol > -1) ? (xCol + 1) : (length + 4);
    yCol = (yCol > -1) ? (yCol + 1) : (length + 5);
    sheet.getRange(1, xCol).setValue(PROJECTED_X_COL);
    sheet.getRange(1, yCol).setValue(PROJECTED_Y_COL);
    standardCols.x = xCol;
    standardCols.y = yCol;
  }
  return standardCols;
}

function geoCols(sheet, data) {
  var fields = data.requestedFields;
  var cols = standardCols(sheet, data);
  var dataCols = data.columns;
  var last = cols.y || -1;
  if (last < cols.lat) last = cols.lat;
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var exists = dataCols.indexOf(field);
    if (exists > -1) {
      cols[field] = exists + 1;
      if (last < cols[field]) last = cols[field];
    } else {
      last++;
      sheet.getRange(1, last).setValue(field);
      cols[field] = last;
    }
  }
  return cols;
}

function setFields(sheet, row, cols, data) {
  var fields = data.requestedFields;
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    sheet.getRange(row, cols[field]).setValue(data.geocodeResp.data[field] || '');
  };
}

function geocoded(data) {
  var row = data.row;
  var sheet = SpreadsheetApp.getActiveSheet();
  var cols = geoCols(sheet, data);
  if (!isNaN(data.lng)) {
    sheet.getRange(row, cols.name).setValue(data.geocodeResp.name);
    sheet.getRange(row, cols.lng).setValue(data.lng);
    sheet.getRange(row, cols.lat).setValue(data.lat);
    if (data.projected) {
      sheet.getRange(row, cols.x).setValue(data.x);
      sheet.getRange(row, cols.y).setValue(data.y);
    }
    setFields(sheet, row, cols, data);
    if (data.interactive) {
      sheet.getRange(row, 1, 1, sheet.getLastColumn()).setBackground(CORRECTED_COLOR);
    }
  } else {
    sheet.getRange(row, 1, 1, sheet.getLastColumn()).setBackground(ERROR_COLOR);
  }
  return {
    row: row,
    columns: sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0], 
    cells: sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0]
  };
}

/* for testing only - removed by build */
global.ADDON_NAME = ADDON_NAME
global.ERROR_COLOR = ERROR_COLOR
global.CORRECTED_COLOR = CORRECTED_COLOR
global.LOCATION_NAME_COL = LOCATION_NAME_COL
global.LONGITUDE_COL = LONGITUDE_COL
global.LATITUDE_COL = LATITUDE_COL
global.PROJECTED_X_COL = PROJECTED_X_COL
global.PROJECTED_Y_COL = PROJECTED_Y_COL
global.onInstall = onInstall
global.onOpen = onOpen
global.show = show
global.getData = getData
global.standardCols = standardCols
global.geoCols = geoCols
global.setFields = setFields
global.geocoded = geocoded