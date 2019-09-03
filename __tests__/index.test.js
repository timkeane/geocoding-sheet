import App from '../src/js/App'

test('index creates app', () => {
  expect.assertions(1)
  
  require('../src/js/index')

  expect(window.app instanceof App).toBe(true)
})