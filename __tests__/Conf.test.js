import Conf from '../src/js/Conf'

beforeEach(() => {
  Conf.set('nyc', true)
  Conf.set('url', '')
  Conf.set('id', '')
  Conf.set('key', '')
  Conf.set('template', '')
  Conf.set('requestedFields', [])
})

describe('set/get', () => {
  const valid = Conf.valid
  beforeEach(() => {
    Conf.valid = jest.fn()
  })
  afterEach(() => {
    Conf.valid = valid
  })

  test('get/set', () => {
    expect.assertions(19)
  
    expect(Conf.get().nyc).toBe(true)
    expect(Conf.get().url).toBe('')
    expect(Conf.get().id).toBe('')
    expect(Conf.get().key).toBe('')
    expect(Conf.get().template).toBe('')
    expect(Conf.get().requestedFields).toEqual([])
  
    Conf.set('nyc', false)  
    Conf.set('url', 'mock-url')
    Conf.set('id', 'mock-id')
    Conf.set('key', 'mock-key')
    Conf.set('template', 'mock-template')
    Conf.set('requestedFields', ['mock-field'])
    expect(Conf.valid).toHaveBeenCalledTimes(6)

    expect(Conf.get('nyc')).toBe(false)
    expect(Conf.get('url')).toBe('mock-url')
    expect(Conf.get('id')).toBe('mock-id')
    expect(Conf.get('key')).toBe('mock-key')
    expect(Conf.get('template')).toBe('mock-template')
    expect(Conf.get('requestedFields')).toEqual(['mock-field'])
  
    expect(Conf.get().nyc).toBe(false)
    expect(Conf.get().url).toBe('mock-url')
    expect(Conf.get().id).toBe('mock-id')
    expect(Conf.get().key).toBe('mock-key')
    expect(Conf.get().template).toBe('mock-template')
    expect(Conf.get().requestedFields).toEqual(['mock-field'])
  })
})

test('valid', () => {
  expect.assertions(6)

  expect(Conf.valid()).toBe(false)

  Conf.set('nyc', true)
  Conf.set('url', 'mock-url')
  Conf.set('id', 'mock-id')
  Conf.set('key', 'mock-key')
  Conf.set('requestedFields', ['mock-field'])

  expect(Conf.valid()).toBe(false)

  Conf.set('template', 'mock-template')

  expect(Conf.valid()).toBe(true)

  Conf.set('requestedFields', [])

  expect(Conf.valid()).toBe(true)

  Conf.set('nyc', false)
  Conf.set('url', '')
  Conf.set('id', '')
  Conf.set('key', '')
  Conf.set('template', '')
  Conf.set('requestedFields', ['mock-field'])

  expect(Conf.valid()).toBe(false)

  Conf.set('template', 'mock-template')

  expect(Conf.valid()).toBe(true)
})

test('getSaved', () => {
  expect.assertions(6)

  const mockDoc = {cookie: 'oreo=a-kind-of-cookie; expires=whenever;geocoding-sheet={"nyc":true,"template":"mock-template","url":"mock-url","id":"mock-id","key":"mock-key","requestedFields":["mock-field"]}; expires=Wed, 26 Aug 2050 20:46:49 GMT'}

  const conf = Conf.getSaved(mockDoc)

  expect(Conf.get('nyc')).toBe(true)
  expect(Conf.get('url')).toBe('mock-url')
  expect(Conf.get('id')).toBe('mock-id')
  expect(Conf.get('key')).toBe('mock-key')
  expect(Conf.get('template')).toBe('mock-template')
  expect(Conf.get('requestedFields')).toEqual(['mock-field'])
})

test('saveToCookie', () => {
  expect.assertions(2)

  const mockDoc = {cookie: 'oreo=a-kind-of-cookie; expires=whenever;'}

  Conf.set('nyc', false)  
  Conf.set('url', 'a-mock-url')
  Conf.set('id', 'a-mock-id')
  Conf.set('key', 'a-mock-key')
  Conf.set('template', 'a-mock-template')
  Conf.set('requestedFields', ['a-mock-field'])

  const today = new Date()
  const expire = new Date()
  expire.setDate(today.getDate() + 365)
  const expectedCookie = `geocoding-sheet={"nyc":false,"url":"a-mock-url","id":"a-mock-id","key":"a-mock-key","template":"a-mock-template","requestedFields":["a-mock-field"]}; expires=${expire.toGMTString()}`
  const conf = Conf.saveToCookie(mockDoc)

  expect(mockDoc.cookie).toBe(expectedCookie)

  //make conf invalid
  Conf.set('template', '')
  Conf.saveToCookie(mockDoc)
  //cookie is unchanged
  expect(mockDoc.cookie).toBe(expectedCookie)
})