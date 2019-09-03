import $ from 'jquery'
import Conf from './Conf'
import SheetGeocoder from './SheetGeocoder'
import layer from './layer'
import Basemap from 'nyc-lib/nyc/ol/Basemap'
import LocationMgr from 'nyc-lib/nyc/ol/LocationMgr'
import Popup from 'nyc-lib/nyc/ol/Popup'
import Tabs from 'nyc-lib/nyc/Tabs'
import Choice from 'nyc-lib/nyc/Choice'
import OSM from 'ol/source/OSM'
import GeoJSON from 'ol/format/GeoJSON'
import TileLayer from 'ol/layer/Tile'
import CensusGeocoder from 'nyc-lib/nyc/CensusGeocoder'
import Geoclient from 'nyc-lib/nyc/Geoclient'
import LocalStorage from 'nyc-lib/nyc/LocalStorage'
import Feature from 'ol/Feature'

class App {
  constructor() {
    const conf = Conf.getSaved(document)
    $('body').html(HTML)
    this.geoclient = new Geoclient({url: this.geoclientUrl()})
    this.census = new CensusGeocoder()
    this.map = new Basemap({target: 'map'})
    this.base = this.map.getBaseLayers().base
    this.label = this.map.getBaseLayers().labels.base
    this.osm = new TileLayer({source: new OSM(), visible: false})
    this.map.addLayer(this.osm)
    this.map.addLayer(layer)
    this.popup = new Popup({map: this.map})
    this.sheetGeocoder = new SheetGeocoder({source: layer.getSource()})
    this.locationMgrCensus = new LocationMgr({map: this.map, geocoder: this.census})
    this.locationMgrGeoclient = new LocationMgr({map: this.map, geocoder: this.geoclient})
    this.searchCtrls = $('.srch-ctl')
    $($('.zoom').get(0)).hide()
    this.geoApi = new Choice({
      target: '#geo-api',
      radio: true,
      choices: API_CHOICES
    })
    this.onInterval = new Choice({
      target: '#on-interv',
      choices: [{name: 'on-interv', label: 'Geocode on interval', values: [1]}]
    })
    const choices = []
    POSSIBLE_FIELDS.forEach(field => {
      choices.push({name: field, label: field, values: [field]})
    })
    this.geoFields = new Choice({
      target: '#geo-fields',
      choices: choices
    })
    $('#geo-fields label').each((i, label) => {
      label.title = label.innerHTML
    })
    this.tabs = new Tabs({
      target: '#tabs',
      tabs: [
        {tab: '#tab-conf', title: 'Configuration', active: true},
        {tab: '#tab-map', title: 'Map'}
      ]
    })
    this.setConfigValues(conf)
    this.hookup()
  }
  setConfigValues(conf) {
    const fields = []
    conf.requestedFields.forEach(f => {
      fields.push({name: f, label: f, values: [f]})
    })
    this.geoFields.val(fields)
    Object.keys(conf).forEach(key => {
      $(`#${key}`).val(conf[key])
    })
    this.geoApi.val(conf.nyc ? [API_CHOICES[0]] : [API_CHOICES[1]])
  }
  hookup() {
    const me = this
    me.geoFields.on('change', this.update, this)
    me.geoApi.on('change', this.update, this)
    $('#geocode').click(() => {
      me.sheetGeocoder.getData(true)
    })
    $('#reset').click(function() {
      me.sheetGeocoder.clear()
    })
    $('#review').change($.proxy(this.review, this))
    $('.pop .btn-x').click(() => {$('#review').trigger('change')})
    this.sheetGeocoder.on('geocoded', event => {
      $(`#review option[value="${event.feature.getId()}"]`).remove()
    })
    $('#download').click($.proxy(this.download, this))
    $('#tab-conf input').keyup($.proxy(this.update, this))
    $(window).resize($.proxy(this.setMapSize, this))
    this.tabs.on('change', this.setMapSize, this)
    this.locationMgrCensus.on('geocoded', this.showPopup, this)
    this.locationMgrGeoclient.on('geocoded', this.showPopup, this)
    this.sheetGeocoder.on('batch-end', this.zoom, this)
    this.sheetGeocoder.on('geocoded', this.syncFeature, this)
    this.sheetGeocoder.on('ambiguous', this.ambiguous, this)
    this.onInterval.on('change', this.update, this)
    this.update()
    if (Conf.valid()) {
      this.tabs.open('#tab-map')
    }
  }
  ambiguous(event) {
    const feature = event.feature
    const data = event.data
    if (data.geocodeResp && data.geocodeResp.possible) {
      const id = feature.getId()
      const result = data.geocodeResp
      const opt = $(`#review option[value="${id}"]`)
      const row = id + 1
      const optHtml = `(${row}) ${result.input}`
      if (!opt.length) {
        $('#review').append(
          $('<option></option>').data('feature', feature)
            .html(optHtml)
            .attr('title', `Row ${row}`).val(id)
        )
      } else {
        opt.html(optHtml)
      }
      this.reviewMsg()
    }
  }
  syncFeature(event) {
    $(`#review option[value="${event.feature.getId()}"]`).remove()
    this.reviewMsg()
  }
  reviewMsg() {
    $($('#review option').get(0)).html(`Review ${$('#review option').length - 1} Failures`)
  }
  zoom() {
    const map = this.map
    map.getView().fit(this.sheetGeocoder.geocodedBounds, {size: map.getSize(), duration: 500});
  }
  review() {
    const id = $('#review').val()
    const feature = $(`#review option[value="${id}"]`).data('feature')
    if (feature) {
      const input = feature.get('_input')
      const locationMgr = Conf.get('nyc') ? this.locationMgrGeoclient : this.locationMgrCensus
      locationMgr.search.input.val(input).data('last-search', input)
      locationMgr.search.trigger('search', input)
    }
  }
  download() {
    const download = []
    const features = layer.getSource().getFeatures()
    features.forEach(f => {
      const props = f.getProperties()
      props.SHEET_ROW_NUM = props._row_num + 1
      delete props.X
      delete props.Y
      delete props.LNG
      delete props.LAT
      delete props._input
      delete props._geocodeResp
      delete props._row_num
      delete props._columns
      delete props._cells
      delete props._source
      const feature = new Feature(props)
      feature.setGeometry(feature.getGeometry())
      download.push(feature)
    })
    const options = {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'}
    new LocalStorage().saveGeoJson('geocoded.json', new GeoJSON().writeFeatures(download, options))
  }
  correctSheet(feature, data) {
    const geocoder = this.sheetGeocoder
    feature.set('_interactive', true)
    feature.once('change', $.proxy(geocoder.geocoded, geocoder))
    geocoder.format.setGeocode(feature, data)
  }
  setMapSize() {
    const div = $('#map')
    const map = this.map
    if (map) {
      map.setSize([div.width(), div.height()])
    }
  }
  update() {
    const nyc = this.geoApi.val()[0].values[0] === 'nyc'
    Conf.set('nyc', nyc)
    Conf.set('url', $('#url').val())
    Conf.set('id', $('#id').val())
    Conf.set('key', $('#key').val())
    Conf.set('template', $('#template').val())
    Conf.set('requestedFields', this.requestedFields())
    $('.gc')[nyc ? 'show' : 'hide']()
    this.setup()
  }
  setup() {
    const nyc = Conf.get('nyc')
    this.base.setVisible(nyc)
    this.label.setVisible(nyc)
    this.osm.setVisible(!nyc)
    $(this.searchCtrls.get(0))[nyc ? 'hide' : 'show']()
    $(this.searchCtrls.get(1))[nyc ? 'show' : 'hide']()
    if (Conf.valid()) {
      this.sheetGeocoder.clear()
      this.sheetGeocoder.projection = nyc ? 'EPSG:2263' : ''
      this.sheetGeocoder.conf(Conf.get())
      this.geoclient.url = this.geoclientUrl()
      if (this.onInterval.val().length) {
        this.tabs.open('#tab-map')
        this.interval = setInterval(() => {
          this.sheetGeocoder.getData(false)
        }, 5000)
      } else {
        clearInterval(this.interval)
      }
    }
  }
  geoclientUrl() {
    return `${Conf.get('url')}/search.json?app_id=${Conf.get('id')}&app_key=${Conf.get('key')}&input=`
  }
  showPopup(data) {
    const me = this
    const id = $('#review').val()
    const feature = $(`#review option[value="${id}"]`).data('feature')
    if (feature) {
      const locationMgr = Conf.get('nyc') ? this.locationMgrGeoclient : this.locationMgrCensus
      const failedAddr = feature.get('_geocodeResp').input
      const lastSearch = locationMgr.search.input.data('last-search')
      if (lastSearch.trim() === failedAddr.trim()) {
        const btn = $('<button class="update btn rad-all"></button>')
          .click(() => {
            me.correctSheet(feature, data)
            me.popup.hide()
          }).html(`Update row ${id * 1}`)
        me.popup.show({
          coordinate: data.coordinate,
          html: $(`<div><h3>${data.name}</h3><div>`).append(btn)
        })
      }
    }
  }
  requestedFields() {
    const fields = []
    if (Conf.get('nyc')) {
      this.geoFields.val().forEach(choice => {
        fields.push(choice.values[0])
      })
    }
    return fields
  }
}

const POSSIBLE_FIELDS = ['assemblyDistrict', 'atomicPolygon', 'bbl', 'bblBoroughCode', 'bblBoroughCodeIn', 'bblTaxBlock', 'bblTaxBlockIn', 'bblTaxLot', 'bblTaxLotIn', 'bikeLane', 'bikeLane2', 'bikeTrafficDirection', 'blockfaceId', 'boardOfElectionsPreferredLgc', 'boePreferredStreetName', 'boePreferredstreetCode', 'boroughCode1In', 'buildingIdentificationNumber', 'buildingIdentificationNumberIn', 'businessImprovementDistrict', 'censusBlock2000', 'censusBlock2010', 'censusTract1990', 'censusTract2000', 'censusTract2010', 'cityCouncilDistrict', 'civilCourtDistrict', 'coincidentSegmentCount', 'communityDistrict', 'communityDistrictBoroughCode', 'communityDistrictNumber', 'communitySchoolDistrict', 'condominiumBillingBbl', 'congressionalDistrict', 'cooperativeIdNumber', 'cornerCode', 'crossStreetNamesFlagIn', 'dcpCommercialStudyArea', 'dcpPreferredLgc', 'dcpPreferredLgcForStreet1', 'dcpPreferredLgcForStreet2', 'dcpPreferredLgcForStreet3', 'dcpZoningMap', 'dotStreetLightContractorArea', 'dynamicBlock', 'electionDistrict', 'fireBattalion', 'fireCompanyNumber', 'fireCompanyType', 'fireDivision', 'firstBoroughName', 'firstStreetCode', 'firstStreetNameNormalized', 'fromActualSegmentNodeId', 'fromLgc1', 'fromLionNodeId', 'fromNode', 'fromPreferredLgcsFirstSetOf5', 'fromXCoordinate', 'fromYCoordinate', 'generatedRecordFlag', 'genericId', 'geosupportFunctionCode', 'geosupportReturnCode', 'geosupportReturnCode2', 'gi5DigitStreetCode1', 'gi5DigitStreetCode2', 'gi5DigitStreetCode3', 'gi5DigitStreetCode4', 'giBoroughCode1', 'giBoroughCode2', 'giBoroughCode3', 'giBoroughCode4', 'giBuildingIdentificationNumber1', 'giBuildingIdentificationNumber2', 'giBuildingIdentificationNumber3', 'giBuildingIdentificationNumber4', 'giDcpPreferredLgc1', 'giDcpPreferredLgc2', 'giDcpPreferredLgc3', 'giDcpPreferredLgc4', 'giHighHouseNumber1', 'giHighHouseNumber2', 'giHighHouseNumber3', 'giHighHouseNumber4', 'giLowHouseNumber1', 'giLowHouseNumber2', 'giLowHouseNumber3', 'giLowHouseNumber4', 'giSideOfStreetIndicator1', 'giSideOfStreetIndicator2', 'giSideOfStreetIndicator3', 'giSideOfStreetIndicator4', 'giStreetCode1', 'giStreetCode2', 'giStreetCode3', 'giStreetCode4', 'giStreetName1', 'giStreetName2', 'giStreetName3', 'giStreetName4', 'healthArea', 'healthCenterDistrict', 'highBblOfThisBuildingsCondominiumUnits', 'highCrossStreetB5SC1', 'highCrossStreetB5SC2', 'highCrossStreetCode1', 'highCrossStreetName1', 'highHouseNumberOfBlockfaceSortFormat', 'houseNumber', 'houseNumberIn', 'houseNumberSortFormat', 'hurricaneEvacuationZone', 'instructionalRegion', 'interimAssistanceEligibilityIndicator', 'internalLabelXCoordinate', 'internalLabelYCoordinate', 'intersectingStreet1', 'intersectingStreet2', 'latitude', 'latitudeInternalLabel', 'latitudeOfFromIntersection', 'latitudeOfToIntersection', 'leftSegment1990CensusTract', 'leftSegment2000CensusBlock', 'leftSegment2000CensusTract', 'leftSegment2010CensusBlock', 'leftSegment2010CensusTract', 'leftSegmentAssemblyDistrict', 'leftSegmentBlockfaceId', 'leftSegmentBoroughCode', 'leftSegmentCommunityDistrict', 'leftSegmentCommunityDistrictBoroughCode', 'leftSegmentCommunityDistrictNumber', 'leftSegmentCommunitySchoolDistrict', 'leftSegmentDynamicBlock', 'leftSegmentElectionDistrict', 'leftSegmentFireBattalion', 'leftSegmentFireCompanyNumber', 'leftSegmentFireCompanyType', 'leftSegmentFireDivision', 'leftSegmentHealthArea', 'leftSegmentHealthCenterDistrict', 'leftSegmentHighHouseNumber', 'leftSegmentInterimAssistanceEligibilityIndicator', 'leftSegmentLowHouseNumber', 'leftSegmentNta', 'leftSegmentNtaName', 'leftSegmentPolicePatrolBorough', 'leftSegmentPolicePatrolBoroughCommand', 'leftSegmentPolicePrecinct', 'leftSegmentPoliceSector', 'leftSegmentPumaCode', 'leftSegmentZipCode', 'legacyId', 'legacySegmentId', 'lengthOfSegmentInFeet', 'lgc1', 'lionBoroughCode', 'lionBoroughCodeForVanityAddress', 'lionFaceCode', 'lionFaceCodeForVanityAddress', 'lionKey', 'lionKeyForVanityAddress', 'lionNodeNumber', 'lionSequenceNumber', 'lionSequenceNumberForVanityAddress', 'listOf4Lgcs', 'listOfPairsOfLevelCodes', 'longitude', 'longitudeInternalLabel', 'longitudeOfFromIntersection', 'longitudeOfToIntersection', 'lowBblOfThisBuildingsCondominiumUnits', 'lowCrossStreetB5SC1', 'lowCrossStreetCode1', 'lowCrossStreetName1', 'lowHouseNumberOfBlockfaceSortFormat', 'lowHouseNumberOfDefiningAddressRange', 'modeSwitchIn', 'nta', 'ntaName', 'numberOfCrossStreetB5SCsHighAddressEnd', 'numberOfCrossStreetB5SCsLowAddressEnd', 'numberOfCrossStreetsHighAddressEnd', 'numberOfCrossStreetsLowAddressEnd', 'numberOfEntriesInListOfGeographicIdentifiers', 'numberOfExistingStructuresOnLot', 'numberOfIntersectingStreets', 'numberOfParkingLanesOnStreet', 'numberOfParkingLanesOnTheStreet', 'numberOfStreetCodesAndNamesInList', 'numberOfStreetFrontagesOfLot', 'numberOfTotalLanesOnStreet', 'numberOfTotalLanesOnTheStreet', 'numberOfTravelLanesOnStreet', 'numberOfTravelLanesOnTheStreet', 'physicalId', 'policePatrolBoroughCommand', 'policePrecinct', 'policeSector', 'pumaCode', 'returnCode1a', 'returnCode1e', 'rightSegment1990CensusTract', 'rightSegment2000CensusBlock', 'rightSegment2000CensusTract', 'rightSegment2010CensusBlock', 'rightSegment2010CensusTract', 'rightSegmentAssemblyDistrict', 'rightSegmentBlockfaceId', 'rightSegmentBoroughCode', 'rightSegmentCommunityDistrict', 'rightSegmentCommunityDistrictBoroughCode', 'rightSegmentCommunityDistrictNumber', 'rightSegmentCommunitySchoolDistrict', 'rightSegmentDynamicBlock', 'rightSegmentElectionDistrict', 'rightSegmentFireBattalion', 'rightSegmentFireCompanyNumber', 'rightSegmentFireCompanyType', 'rightSegmentFireDivision', 'rightSegmentHealthArea', 'rightSegmentHealthCenterDistrict', 'rightSegmentHighHouseNumber', 'rightSegmentInterimAssistanceEligibilityIndicator', 'rightSegmentLowHouseNumber', 'rightSegmentNta', 'rightSegmentNtaName', 'rightSegmentPolicePatrolBorough', 'rightSegmentPolicePatrolBoroughCommand', 'rightSegmentPolicePrecinct', 'rightSegmentPoliceSector', 'rightSegmentPumaCode', 'rightSegmentZipCode', 'roadwayType', 'rpadBuildingClassificationCode', 'rpadSelfCheckCodeForBbl', 'sanbornBoroughCode', 'sanbornBoroughCode1', 'sanbornBoroughCode2', 'sanbornPageNumber', 'sanbornPageNumber1', 'sanbornPageNumber2', 'sanbornVolumeNumber', 'sanbornVolumeNumber1', 'sanbornVolumeNumber2', 'sanbornVolumeNumberSuffix', 'sanbornVolumeNumberSuffix1', 'sanbornVolumeNumberSuffix2', 'sanitationBulkPickupSchedule', 'sanitationCollectionSchedulingSectionAndSubsection', 'sanitationDistrict', 'sanitationRecyclingCollectionSchedule', 'sanitationRegularCollectionSchedule', 'sanitationSection', 'sanitationSnowPriorityCode', 'secondStreetCode', 'secondStreetNameNormalized', 'segmentAzimuth', 'segmentIdentifier', 'segmentLengthInFeet', 'segmentOrientation', 'segmentTypeCode', 'sideOfStreetIndicator', 'sideOfStreetOfVanityAddress', 'speedLimit', 'splitLowHouseNumber', 'stateSenatorialDistrict', 'streetCode1', 'streetCode2', 'streetCode6', 'streetCode7', 'streetName1', 'streetName1In', 'streetName2', 'streetName2In', 'streetName3In', 'streetName6', 'streetName7', 'streetStatus', 'streetWidth', 'streetWidthMaximum', 'strollingKey', 'strollingKeyBoroughCode', 'strollingKeyHighHouseNumber', 'strollingKeyOnStreetCode', 'strollingKeySideOfStreetIndicator', 'taxMapNumberSectionAndVolume', 'thirdStreetCode', 'thirdStreetNameNormalized', 'toActualSegmentNodeId', 'toLgc1', 'toLionNodeId', 'toNode', 'toPreferredLgcsFirstSetOf5', 'toXCoordinate', 'toYCoordinate', 'trafficDirection', 'underlyingStreetCode', 'uspsPreferredCityName', 'workAreaFormatIndicatorIn', 'xCoordActualSegmentHighAddressEnd', 'xCoordActualSegmentLowAddressEnd', 'xCoordinate', 'xCoordinateHighAddressEnd', 'xCoordinateLowAddressEnd', 'xCoordinateOfCenterofCurvature', 'yCoordActualSegmentHighAddressEnd', 'yCoordActualSegmentLowAddressEnd', 'yCoordinate', 'yCoordinateHighAddressEnd', 'yCoordinateLowAddressEnd', 'yCoordinateOfCenterofCurvature', 'zipCode']
const API_CHOICES = [
  {name: 'geo-api', label: 'NYC Geoclient', values: ['nyc'], checked: true},
  {name: 'geo-api', label: 'Census', values: ['census']}
]
const HTML = `<div id="tabs">
  <div id="tab-conf">
    <label class="conf" for="url">Geocoder</label>
    <div id="geo-api"></div>
    <label class="conf" for="template">Geocode-able location definition</label>
    <input id="template" class="rad-all" type="text" placeholder="Eg. &#36;{AddrCol}, &#36;{CityCol}, &#36;{ZipCol}">
    <div id="on-interv"></div>
    <label class="conf gc" for="url">Geoclient endpoint</label>
    <input id="url" class="rad-all gc" type="text" placeholder="Eg. https://maps.nyc.gov/geoclient/v1">
    <label class="conf gc" for="id">Geoclient App ID</label>
    <input id="id" class="rad-all gc" type="text">
    <label class="conf gc" for="key">Geoclient App Key</label>
    <input id="key" class="rad-all gc" type="text">
    <label class="conf gc" for="geo-fields">Possible Geocoded values to append (if available)</label>
    <div id="geo-fields" class="gc"></div>
  </div>
  <div id="tab-map">
    <button id="geocode" class="btn btn-sq rad-all" title="Geocode sheet">
      <span class="screen-reader-only">Geocode sheet</span>
    </button>
    <select id="review" class="btn rad-all">
      <option value="-1">Review 0 Failures</option>
    </select>
    <button id="reset" class="btn btn-sq rad-all" title="Reset map">
        <span class="screen-reader-only">Reset map</span>
    </button>
    <div id="map" class="rad-all"></div>
    <button id="download" class="btn btn-sq rad-all" title="Download GeoJSON">
      <span class="screen-reader-only">Download GeoJSON</span>
    </button>
  </div>  
</div>`

App.POSSIBLE_FIELDS = POSSIBLE_FIELDS

export default App