const template = {}
const page = {}
const HtmlService = {}

const resetMocks = () => {
  HtmlService.createTemplateFromFile = jest.fn().mockImplementation((fileName) => {
    return template
  })
  template.evaluate = jest.fn().mockImplementation(() => {
    return page
  })
  page.setTitle = jest.fn().mockImplementation(() => {
    return page
  })
}

resetMocks()

HtmlService.resetMocks = resetMocks

global.HtmlService = HtmlService

export default HtmlService