import CvAddr from 'nyc-lib/nyc/ol/format/CsvAddr'
import Geoclient from 'nyc-lib/nyc/Geoclient'
import CensusGeocoder from 'nyc-lib/nyc/CensusGeocoder'

const format = new CvAddr({})

export default {
  getFormat(conf) {
    format.locationTemplate = conf.template
    if (conf.nyc) {
      const url = `${conf.url}/search.json?app_id=${conf.id}&app_key=${conf.key}`
      format.geocoder = new Geoclient({url})
    } else {
      format.geocoder = new CensusGeocoder()
    }
    return format
  }
}