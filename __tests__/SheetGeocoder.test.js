import SheetGeocoder from '../src/js/SheetGeocoder'
import EventHandling from 'nyc-lib/nyc/EventHandling'
import Source from 'ol/source/Vector'
import Conf from '../src/js/Conf'
import CsvAddr from 'nyc-lib/nyc/ol/format/CsvAddr'
import Feature from 'ol/Feature'
import google from './goog.mock'
import MockData from './Data.mock'
import SpreadsheetApp from './SpreadsheetApp.mock'
import Point from 'ol/geom/Point'
import {extend} from 'ol/extent'
import Basemap from 'nyc-lib/nyc/ol/Basemap'
import CensusGeocoder from 'nyc-lib/nyc/CensusGeocoder'
import Geoclient from 'nyc-lib/nyc/Geoclient'
import proj4 from 'proj4'

const getBounds = features => {
  let bounds
  features.forEach(f => {
    const g = f.getGeometry()
    if (g) {
      const e = g.getExtent()
      bounds = bounds ? extend(bounds, e) : e
    }
  })
  return bounds
}
const getGeocodeResp = (success, props, interactive) => {
  return {
    input: `${props.num || ''} ${props.street || ''}, ${interactive ? 1 : ''}`,
    data: success ? {
      assemblyDistrict: props.assemblyDistrict,
      bbl: props.bbl
    } : undefined
  }
}

const getGeocodedFeatures = interactive => {
  const features = []
  MockData.GEOCODED_FEATURES.forEach((f, i) => {
    const props = f.getProperties()
    const feature = new Feature(props)
    const geom = f.getGeometry()
    feature.setId(f.getId())
    feature.set('_input', `${props.num || ''} ${props.street || ''}, `)
    if (geom) {
      feature.set('_geocodeResp', getGeocodeResp(true, props, interactive))
      feature.setGeometry(new Point(geom.getCoordinates()))
    } else {
    feature.set('_geocodeResp', getGeocodeResp(false, props, interactive))
    feature.set('boro', interactive ? 1 : '')
      feature.set('_row_num', i) 
      feature.set('_columns', MockData.GEOCODED_SHEET_PROJECT[0]) 
      feature.set('_cells', MockData.GEOCODED_SHEET_PROJECT[i + 1])
      feature.set('_interactive', true)
    }
    features.push(feature)
  })
  return features
}

const VALID_NYC_CONF = {
  nyc: true,
  url: 'mock-url',
  id: 'mock-id',
  key: 'mock-key',
  template: '${num} ${street}, ${boro}',
  requestedFields: []
}

beforeEach(() => {
  // CensusGeocoder.mockClear()
  // Geoclient.mockClear()
  MockData.resetMocks()
})

describe('constructor', () => {
  const clear = SheetGeocoder.prototype.clear
  beforeEach(() => {
    SheetGeocoder.prototype.clear = jest.fn()
  })
  
  afterEach(() => {
    SheetGeocoder.prototype.clear = clear
  })

  test('constructor', () => {
    expect.assertions(5)

    const geo = new SheetGeocoder({source: 'mock-source', projection: 'mock-proj'})

    expect(geo instanceof SheetGeocoder).toBe(true)
    expect(geo instanceof EventHandling).toBe(true)
    expect(geo.source).toBe('mock-source')
    expect(geo.projection).toBe('mock-proj')
    expect(SheetGeocoder.prototype.clear).toHaveBeenCalledTimes(1)
  })
})

describe('conf', () => {
  test('conf is nyc', () => {
    expect.assertions(3)

    Conf.set()
    const geo = new SheetGeocoder({source: new Source()})

    geo.conf(VALID_NYC_CONF)

    expect(geo.format instanceof CsvAddr).toBe(true)
    expect(geo.format.geocoder instanceof Geoclient).toBe(true)
    expect(geo.format.geocoder.url).toBe('mock-url/search.json?app_id=mock-id&app_key=mock-key&input=')
  })

  test('conf not nyc', () => {
    expect.assertions(2)

    Conf.set()
    const geo = new SheetGeocoder({source: new Source()})

    geo.conf({
      nyc: false,
      url: 'mock-url',
      template: 'mock-template',
      requestedFields: []
    })

    expect(geo.format instanceof CsvAddr).toBe(true)
    expect(geo.format.geocoder instanceof CensusGeocoder).toBe(true)
  })
})

test('clear', () => {
  expect.assertions(8)

  const source = {clear: jest.fn()}

  const geo = new SheetGeocoder({source: source})

  geo.geocodeAll = true
  geo.countDown = 100
  geo.geocodedBounds = 'mock-bounds'

  geo.clear()

  expect(geo.geocodeAll).toBe(false)
  expect(geo.countDown).toBe(0)
  expect(geo.geocodedBounds).toBeNull()
  expect(source.clear).toHaveBeenCalledTimes(2)

  geo.source = null

  geo.geocodeAll = true
  geo.countDown = 200
  geo.geocodedBounds = 'another-mock-bounds'

  geo.clear()

  expect(geo.geocodeAll).toBe(false)
  expect(geo.countDown).toBe(0)
  expect(geo.geocodedBounds).toBeNull()
  expect(source.clear).toHaveBeenCalledTimes(2)
})

test('doGeocode', () => {
  expect.assertions(3)

  const featureSource = {
    num: 2,
    street: 'broadway',
    boro: ''
  }
  const feature = new Feature({_input: '2 broadway, '})

  const geo = new SheetGeocoder({source: new Source()})

  geo.conf({nyc: false, template: '${num} ${street}, ${boro}'})

  expect(geo.doGeocode(featureSource)).toBe(true)

  expect(geo.doGeocode(featureSource, feature)).toBe(false)

  featureSource.boro = 1

  expect(geo.doGeocode(featureSource, feature)).toBe(true)
})

describe('getData', () => {
  const gotData = SheetGeocoder.prototype.gotData

  beforeEach(() => {
    SheetGeocoder.prototype.gotData = jest.fn()
  })
  afterEach(() => {
    SheetGeocoder.prototype.gotData = gotData
  })

  test('getData', () => {
    expect.assertions(8)
  
    google.returnData = MockData.NOT_GEOCODED_SHEET_PROJECT
  
    const geo = new SheetGeocoder({source: new Source()})
  
    geo.conf(VALID_NYC_CONF)
  
    geo.getData()
  
    expect(geo.geocodeAll).toBe(false)
    expect(google.script.run.withSuccessHandler).toHaveBeenCalledTimes(1)
    expect(geo.gotData).toHaveBeenCalledTimes(1)
    expect(geo.gotData.mock.calls[0][0]).toBe(MockData.NOT_GEOCODED_SHEET_PROJECT)
  
    geo.getData(true)

    expect(geo.geocodeAll).toBe(true)
    expect(google.script.run.withSuccessHandler).toHaveBeenCalledTimes(2)
    expect(geo.gotData).toHaveBeenCalledTimes(2)
    expect(geo.gotData.mock.calls[1][0]).toBe(MockData.NOT_GEOCODED_SHEET_PROJECT)
  })
})

describe('gotData', () => {
  const gsGeocoded = geocoded
  const sheetGeoGeocoded = SheetGeocoder.prototype.geocoded
  const setGeometry = CsvAddr.prototype.setGeometry
  const testSetGeometry = (geo, sheet, times) => {
    expect(geo.format.setGeometry).toHaveBeenCalledTimes(times)
    geo.format.setGeometry.mock.calls.forEach((call, i) => {
      const feature = geo.source.getFeatureById(i + 2)
      expect(call[0]).toBe(feature)
      expect(call[1]).toEqual({
        num: feature.get('num'),
        street: feature.get('street'),
        boro: feature.get('boro'),
        LOCATION_NAME: feature.get('LOCATION_NAME'),
        LNG: feature.get('LNG'),
        LAT: feature.get('LAT'),
        X: feature.get('X'),
        Y: feature.get('Y'),
        assemblyDistrict: feature.get('assemblyDistrict'),
        bbl: feature.get('bbl'),
        _columns: sheet[0],
        _cells: sheet[i + 1],
        _row_num: i + 2
      })
    })
  }
  
  const testFeatureChangeRunsGeocoded = (geo, times) => {
    expect(geo.geocoded).toHaveBeenCalledTimes(times)
    geo.geocoded.mock.calls.forEach((call, i) => {
      expect(call[0]).toEqual({
        type: 'change',
        target: geo.source.getFeatureById(i + 2)
      })  
    })  
  }

  beforeEach(() => {
    geocoded = jest.fn()
    SheetGeocoder.prototype.geocoded = jest.fn()
    CsvAddr.prototype.setGeometry = jest.fn().mockImplementation((feature, source) => {
      feature.dispatchEvent({type: 'change', target: feature})
    })
    afterEach(() => {
      geocoded = gsGeocoded
      SheetGeocoder.prototype.geocoded = sheetGeoGeocoded
      CsvAddr.prototype.setGeometry = setGeometry
    })
  })

  test('gotData geocodeAll is true', () => {
    expect.assertions(12)

    const sheet = MockData.NOT_GEOCODED_SHEET_PROJECT

    const geo = new SheetGeocoder({source: new Source()})

    geo.conf(VALID_NYC_CONF)
    geo.geocodeAll = true

    geo.on('batch-start', data => {
      expect(data).toBe(MockData.NOT_GEOCODED_SHEET_PROJECT)
    })

    geo.gotData(MockData.NOT_GEOCODED_SHEET_PROJECT)

    testSetGeometry(geo, MockData.NOT_GEOCODED_SHEET_PROJECT, 3)
    testFeatureChangeRunsGeocoded(geo, 3)
  })

  test('gotData geocodeAll is false', () => {
    expect.assertions(11)

    const sheet = MockData.GEOCODED_SHEET_PROJECT

    const geo = new SheetGeocoder({
      source: new Source({
        /* will not be cleared because geocodeAll === false */
        features: MockData.GEOCODED_FEATURES 
      })
    })

    geo.conf(VALID_NYC_CONF)
    geo.geocodeAll = false

    geo.on('batch-start', data => {
      fail('no batch should be started')
    })

    geo.gotData(MockData.GEOCODED_SHEET_PROJECT)

    testSetGeometry(geo, MockData.GEOCODED_SHEET_PROJECT, 3)
    testFeatureChangeRunsGeocoded(geo, 3)
  })

  test('gotData geocodeAll is false - one interactive changed', () => {
    expect.assertions(8)

    const sheet = MockData.GEOCODED_SHEET_PROJECT

    const geo = new SheetGeocoder({source: new Source()})

    geo.conf(VALID_NYC_CONF)
    geo.geocodeAll = false
    geo.source.addFeatures(getGeocodedFeatures(true))

    geo.on('batch-start', data => {
      fail('no batch should be started')
    })

    geo.gotData(MockData.GEOCODED_SHEET_PROJECT)

    testSetGeometry(geo, MockData.GEOCODED_SHEET_PROJECT, 2)
    testFeatureChangeRunsGeocoded(geo, 2)
  })

  test('gotData geocodeAll is false - one interactive unchanged', () => {
    expect.assertions(8)

    const sheet = MockData.GEOCODED_SHEET_PROJECT

    const geo = new SheetGeocoder({source: new Source()})

    geo.conf(VALID_NYC_CONF)
    geo.geocodeAll = false
    geo.source.addFeatures(getGeocodedFeatures())

    geo.on('batch-start', data => {
      fail('no batch should be started')
    })

    geo.gotData(MockData.GEOCODED_SHEET_PROJECT)

    testSetGeometry(geo, MockData.GEOCODED_SHEET_PROJECT, 2)
    testFeatureChangeRunsGeocoded(geo, 2)
  })

})

describe('geocoded', () => {

  const testGeocodededEvent = (feature, event) => {
    expect(event.feature).toBe(feature)
    expect(event.data.geocodeResp).toEqual(feature.get('_geocodeResp'))
    expect(event.data.lat.toFixed(8)).toEqual(feature.get('LAT').toFixed(8))
    expect(event.data.lng.toFixed(8)).toEqual(feature.get('LNG').toFixed(8))
  }

  const testGeocoded = (geo, features) => {
    expect(geo.updateFeature).toHaveBeenCalledTimes(1)
    expect(geo.updateFeature.mock.calls[0][0]).toEqual(google.returnData)
    
    expect(geo.projected).toHaveBeenCalledTimes(features.length)
    
    features.forEach((f, i) => {
      expect(geo.projected.mock.calls[i][0].geocodeResp).toEqual(f.get('_geocodeResp'))
      expect(geo.projected.mock.calls[i][0].lat.toFixed(8)).toEqual(f.get('LAT').toFixed(8))
      expect(geo.projected.mock.calls[i][0].lng.toFixed(8)).toEqual(f.get('LNG').toFixed(8))
    })
  }
  const updateFeature = SheetGeocoder.prototype.updateFeature
  const projected = SheetGeocoder.prototype.projected
  beforeEach(() => {
    SheetGeocoder.prototype.updateFeature = jest.fn()
    SheetGeocoder.prototype.projected = jest.fn()
  })
  afterEach(() => {
    SheetGeocoder.prototype.updateFeature = updateFeature
    SheetGeocoder.prototype.projected = projected
  })

  test('geocoded - geocodeAll is true - geocode successful - not done', () => {
    expect.assertions(13)

    google.returnData = {
      row: 2,
      columns: MockData.GEOCODED_SHEET_PROJECT[0], 
      cells: MockData.GEOCODED_SHEET_PROJECT[1]
    }

    const features = getGeocodedFeatures()
    const feature = features[0]

    const geo = new SheetGeocoder({source: new Source()})

    expect(geo.geocodedBounds).toBeNull()

    geo.on('batch-start', () => {
      fail('batch already started')
    })
    geo.on('batch-end', () => {
      fail('batch not done')
    })
    geo.on('ambiguous', () => {
      fail('ambiguous should fire')
    })

    geo.on('geocoded', event => {
      testGeocodededEvent(feature, event)
    })

    geo.conf(VALID_NYC_CONF)
    geo.geocodeAll = true
    geo.countDown = 10
    geo.source.addFeatures(features)

    geo.geocoded({target: feature})

    expect(geo.countDown).toBe(9)

    expect(geo.geocodedBounds).toEqual(getBounds([feature]))

    testGeocoded(geo, [feature])
  })

  test('geocoded - geocodeAll is true - geocode successful - is done', () => {
    expect.assertions(14)

    google.returnData = {
      row: 2,
      columns: MockData.GEOCODED_SHEET_PROJECT[0], 
      cells: MockData.GEOCODED_SHEET_PROJECT[1]
    }

    const features = getGeocodedFeatures()
    const feature = features[0]

    const geo = new SheetGeocoder({source: new Source()})

    expect(geo.geocodedBounds).toBeNull()

    geo.on('batch-start', () => {
      fail('batch already started')
    })
    geo.on('batch-end', () => {
      expect(1).toBe(1)
    })
    geo.on('ambiguous', () => {
      fail('ambiguous should fire')
    })

    geo.on('geocoded', event => {
      testGeocodededEvent(feature, event)
    })

    geo.conf(VALID_NYC_CONF)
    geo.geocodeAll = true
    geo.countDown = 1
    geo.source.addFeatures(features)
    geo.geocodedBounds = getBounds([features[1]])

    geo.geocoded({target: feature})

    expect(geo.geocodedBounds).toEqual(getBounds([features[0], features[1]]))

    expect(geo.countDown).toBe(0)

    testGeocoded(geo, [feature])
  })

  test('geocoded - geocodeAll is false - geocode successful - is done', () => {
    expect.assertions(5)

    google.returnData = {
      row: 2,
      columns: MockData.GEOCODED_SHEET_PROJECT[0], 
      cells: MockData.GEOCODED_SHEET_PROJECT[1]
    }

    const features = getGeocodedFeatures()
    const feature = features[2]

    const geo = new SheetGeocoder({source: new Source()})

    expect(geo.geocodedBounds).toBeNull()

    geo.on('batch-start', () => {
      fail('batch should not started')
    })
    geo.on('batch-end', () => {
      fail('batch should not started')
    })
    geo.on('geocoded', event => {
      fail('geocoded should not fire')
    })

    geo.on('ambiguous', event => {
      expect(event.feature).toBe(feature)
      expect(event.data.geocodeResp).toEqual(feature.get('_geocodeResp'))
    })

    geo.conf(VALID_NYC_CONF)
    geo.geocodeAll = false
    geo.countDown = 0
    geo.source.addFeatures(features)
    geo.geocodedBounds = getBounds([features[1]])

    geo.geocoded({target: feature})

    expect(geo.geocodedBounds).toEqual(getBounds([features[1]]))

    expect(geo.countDown).toBe(0)

  })

})

test('projected', () => {
  expect.assertions(4)

  const data = {}
  const expected = proj4('EPSG:3857', 'EPSG:2263', Basemap.CENTER)

  const geo = new SheetGeocoder({})

  geo.projected(data, Basemap.CENTER)

  expect(data.x).toBeUndefined()
  expect(data.y).toBeUndefined()

  geo.projection = 'EPSG:2263'

  geo.projected(data, Basemap.CENTER)

  expect(data.x).toBe(expected[0])
  expect(data.y).toBe(expected[1])
})

test('updateFeature', () => {
  expect.assertions(3)

  const feature = new Feature()
  feature.setId(2)

  const mockSource = {
    getFeatureById: jest.fn().mockImplementation(id => {
      if (id === feature.getId()) return feature
    })
  }

  const data = {
    row: 2, 
    columns: ['num', 'street', 'boro'],
    cells: [59, 'maiden', 1]
  }

  const geo = new SheetGeocoder({})
  
  geo.source = mockSource

  geo.updateFeature(data)

  data.columns.forEach((col, i) => {
    expect(feature.get(col)).toBe(data.cells[i])
  })

  feature.setId(111)

  geo.updateFeature(data)
})