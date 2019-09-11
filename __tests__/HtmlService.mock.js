const template = {}
const page = {}
const output = {}
const HtmlService = {}

const resetMocks = () => {
  HtmlService.createHtmlOutputFromFile = jest.fn().mockImplementation(fileName => {
    return output
  })
  HtmlService.createTemplateFromFile = jest.fn().mockImplementation(fileName => {
    return template
  })
  template.evaluate = jest.fn().mockImplementation(() => {
    return page
  })
  page.setTitle = jest.fn().mockImplementation(() => {
    return page
  })
  output.getContent = jest.fn().mockImplementation(() => {
    return 'mock-content'
  })
}

resetMocks()

HtmlService.resetMocks = resetMocks

global.HtmlService = HtmlService

export default HtmlService