import { describe, it, expect } from 'vitest'
import { typeLabel, assetFolderNames, zipFileName } from '~/utils/zip'

describe('zip naming', () => {
  it('typeLabel maps and custom slug', () => {
    expect(typeLabel('primary_logo')).toBe('Primary_Logo')
    expect(typeLabel('app_icon_source')).toBe('App_Icon_Source')
    expect(typeLabel('custom', 'My Mark')).toBe('My_Mark')
    expect(typeLabel('custom')).toBe('Custom')
  })
  it('assetFolderNames numbers and dedups', () => {
    const folders = assetFolderNames([
      { id: 'a', type: 'primary_logo' },
      { id: 'b', type: 'primary_logo' },
      { id: 'c', type: 'logo_mark' }
    ])
    expect(folders.map(f => f.folder)).toEqual(['01_Primary_Logo', '01_Primary_Logo-2', '02_Logo_Mark'])
  })
  it('zipFileName capitalizes slug', () => {
    expect(zipFileName('Acme Corporation')).toBe('Acme-corporation_Logo_Asset_Pack.zip')
  })
})
