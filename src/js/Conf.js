const COOKIE = 'geocoding-sheet'

const config = {
  nyc: true,
  url: '',
  id: '',
  key: '',
  template: '',
  requestedFields: []
}

const conf = {
  set(key, val) {
    config[key] = val
    conf.saveToCookie(document)
  },
  get(key) {
    if (key) return config[key]
    return config
  },
  valid() {
    let result = false
    if (config.nyc) {
      result = config.url.trim() !== '' && 
      config.id.trim() !== '' && 
      config.key.trim() !== '' && 
      config.template.trim() !== ''
    } else {
      result = config.template.trim() !== ''
    }
    return result
  },
  getSaved(doc) {
    const it = `${COOKIE}=`
    
    const cookies = doc.cookie.split(';')
    cookies.forEach(cookie => {
      cookie = cookie.trim();
      if (cookie.indexOf(it) === 0) {
        const savedConf = JSON.parse(cookie.substr(it.length, cookie.length))
        Object.keys(savedConf).forEach(key => {
          config[key] = savedConf[key]
        })
      }
    })
    return config
  },
  saveToCookie(doc) {
    if (conf.valid()) {
      const today = new Date()
      const expire = new Date()
      expire.setDate(today.getDate() + 365)
      doc.cookie = `${COOKIE}=${JSON.stringify(config)}; expires=${expire.toGMTString()}`
    }
  }
}

export default conf
