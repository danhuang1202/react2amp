export function getAmpAsset(entry: string = '', assetFile: string = '') {
  let assetMap = {}
  try {
    assetMap = require(assetFile) || {}
  } catch (e) {
    console.error(`require ${assetFile} failed, ${e}`)
  }

  return assetMap[entry]
}
