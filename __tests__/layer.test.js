import layer from '../src/js/layer'
import Layer from 'ol/layer/Vector'
import Source from 'ol/source/Vector'
import Feature from 'ol/Feature'
import nycOl from 'nyc-lib/nyc/ol'

test('module exports instance of ol/layer/Vector', () => {
  expect.assertions(5)

  expect(layer instanceof Layer).toBe(true)
  expect(layer.getSource() instanceof Source).toBe(true)
  expect(layer.getSource().getFeatures().length).toBe(0)
  expect(layer.getSource().getFormat()).toBeUndefined()
  expect(typeof layer.getStyle()).toBe('function')
})

test('style', () => {
  expect.assertions(10)

  const styleFn = layer.getStyle()
  const tileGid = nycOl.TILE_GRID
  const feature = new Feature()

  feature.setId(1)

  let style = styleFn(feature, tileGid.getResolutions()[10])

  expect(style.getImage().getRadius()).toBe(10)
  expect(style.getImage().getRadius()).toBe(10)
  
  expect(style.getImage().getStroke().getColor()).toBe('#000')
  expect(style.getImage().getStroke().getWidth()).toBe(2)
  
  expect(style.getImage().getFill().getColor()).toBe('rgba(255,255,255,.5)')
  
  expect(style.getText().getText()).toBe('2')
  expect(style.getText().getFill().getColor()).toBe('#000')
  expect(style.getText().getFont()).toBe('bold 12px sans-serif')
  
  feature.setId(100)

  style = styleFn(feature, tileGid.getResolutions()[10])

  expect(style.getText().getFont()).toBe('8px sans-serif')
  
  style = styleFn(feature, tileGid.getResolutions()[14])

  expect(style.getText().getFont()).toBe('11px sans-serif')
})