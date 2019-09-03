const run = {}

const goog = {
  returnData: null,
  script: {
    run: run
  }
}

const scripts = {}

const resetMocks = () => {
  goog.returnData = null
  run.withSuccessHandler = jest.fn().mockImplementation(callback => {
    scripts.callback = callback
    return scripts
  })
  scripts.getData = jest.fn().mockImplementation(() => {
    scripts.callback(goog.returnData)
  })
  scripts.geocoded = jest.fn().mockImplementation(() => {
    scripts.callback(goog.returnData)
  })
}

resetMocks()

goog.resetMocks = resetMocks

global.google = goog

export default goog