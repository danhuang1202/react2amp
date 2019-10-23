const fs = require('fs')
const path = require('path')
const matchAll = require('string.prototype.matchall')

type FileName = string

type Entries = string[]

type ExcludeResourcesRegExp = RegExp

type Options = {
  filename: FileName
  includeEntries?: Entries
  excludeEntries?: Entries
  excludeResourcesRegExp?: ExcludeResourcesRegExp
}

type AmpComponentMap = {
  [key: string]: number
}

export type AmpScript = {
  name: string
  version: number
}[]

// build-in amp component: https://github.com/ampproject/amphtml/blob/14f3365261ad845cebbdaf9633ef702e4f50aa96/spec/amp-html-components.md#components
const AMP_BUILD_IN_COMPONENTS = ['amp-img', 'amp-layout', 'amp-pixel']
const AMP_COMPONENTS_DEFAULT_VERSION = 0.1
const AMP_BIND_TAG = 'amp-bind'
const AMP_STATE_TAG = 'amp-state'
const AMP_FORM_TAG = 'amp-form'
const AMP_FORM_SUPPORT_TAG = ['input', 'form']

class AmpAssetPlugin {
  private filename: FileName
  private includeEntries: Entries
  private excludeEntries: Entries
  private excludeResourcesRegExp: ExcludeResourcesRegExp

  public constructor(options: Options) {
    this.filename = options.filename
    this.includeEntries = options.includeEntries || []
    this.excludeEntries = options.excludeEntries || []
    this.excludeResourcesRegExp = options.excludeResourcesRegExp
  }

  public apply(compiler) {
    compiler.hooks.emit.tapAsync('AmpAssetsPlugin', (compilation, callback) => {
      const result = {}
      // const ampComponentMap = {}
      const javascriptRegex = /\.(js|mjs)(\?|$)/
      const cssRegex = /\.css(\?|$)/

      for (const [entry, data] of compilation.entrypoints.entries()) {
        if (
          this.includeEntries.length &&
          this.includeEntries.indexOf(entry) === -1
        ) {
          continue
        }

        if (
          this.excludeEntries.length &&
          this.excludeEntries.indexOf(entry) !== -1
        ) {
          continue
        }

        let scripts = {}
        let css = ''

        data.chunks.forEach(chunk => {
          // const modules = chunk.getModules() || []

          // for (let i = 0; i < modules.length; i++) {
          //   const module = modules[i]
          //   const moduleType = module.constructor.name

          //   if (moduleType === 'ConcatenatedModule') {
          //     for (const concatennation of module._orderedConcatenationList) {
          //       const { type, module } = concatennation
          //       if (type !== 'concatenated') {
          //         continue
          //       }

          //       // module reference: https://github.com/webpack/docs/wiki/plugins#the-normalmodulefactory
          //       const { request, _source } = module

          //       if (
          //         !_source ||
          //         !javascriptRegex.test(request) ||
          //         (this.excludeResourcesRegExp &&
          //           this.excludeResourcesRegExp.test(request))
          //       ) {
          //         continue
          //       }

          //       if (ampComponentMap[request]) {
          //         scripts = this.dedupAmpCompoents(
          //           scripts,
          //           ampComponentMap[request]
          //         )
          //       } else {
          //         const newAmpComponents = this.findAmpComponents(
          //           _source.source()
          //         )

          //         if (newAmpComponents) {
          //           ampComponentMap[request] = newAmpComponents
          //           scripts = this.dedupAmpCompoents(scripts, newAmpComponents)
          //         }
          //       }
          //     }
          //   } else if (moduleType === 'NormalModule') {
          //     // module reference: https://github.com/webpack/docs/wiki/plugins#the-normalmodulefactory
          //     const { request, _source } = module

          //     if (
          //       !_source ||
          //       !javascriptRegex.test(request) ||
          //       (this.excludeResourcesRegExp &&
          //         this.excludeResourcesRegExp.test(request))
          //     ) {
          //       continue
          //     }

          //     if (ampComponentMap[request]) {
          //       scripts = this.dedupAmpCompoents(
          //         scripts,
          //         ampComponentMap[request]
          //       )
          //     } else {
          //       const newAmpComponents = this.findAmpComponents(
          //         _source.source()
          //       )

          //       if (newAmpComponents) {
          //         ampComponentMap[request] = newAmpComponents
          //         scripts = this.dedupAmpCompoents(scripts, newAmpComponents)
          //       }
          //     }
          //   }
          // }

          const files = chunk.files
          for (let i = 0; i < files.length; i++) {
            const filename = files[i]
            if (javascriptRegex.test(filename)) {
              const newAmpComponents = this.findAmpComponents(
                compilation.assets[filename].source()
              )
              if (newAmpComponents) {
                scripts = this.dedupAmpCompoents(scripts, newAmpComponents)
              }
            }

            if (cssRegex.test(filename)) {
              css += compilation.assets[filename].source()
            }
          }
        })

        result[entry] = {
          scripts: this.formattedAmpScript(scripts),
          css
        }
      }

      const outputDirectory = path.dirname(this.filename)

      try {
        fs.mkdirSync(outputDirectory)
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error
        }
      }

      const jsonResult = JSON.stringify(result, null, 2)
      fs.writeFileSync(this.filename, jsonResult)

      callback()
    })
  }

  private findAmpComponents(source: string): AmpComponentMap | void {
    const ampComponentRegex = /\(['|"](amp-.*?|form|input)['|"]\s*,.*?{(.*?)}/g
    const versionRegex = /["|']data-ver["|']\s*:\s*["|'](.*?)["|']/
    const sourceWithoutNewLine = source.replace(/\r?\n/g, '')
    const matches = matchAll(sourceWithoutNewLine, ampComponentRegex)
    let result

    for (const match of matches) {
      let tag = match[1]
      const attributes = match[2]

      if (AMP_BUILD_IN_COMPONENTS.indexOf(tag) !== -1) {
        continue
      }

      if (!result) {
        result = {}
      }

      if (tag === AMP_STATE_TAG) {
        tag = AMP_BIND_TAG
      }

      if (AMP_FORM_SUPPORT_TAG.indexOf(tag) !== -1) {
        tag = AMP_FORM_TAG
      }

      const versionMatch = attributes.match(versionRegex)
      result[tag] =
        (versionMatch && parseFloat(versionMatch[1])) ||
        AMP_COMPONENTS_DEFAULT_VERSION
    }

    return result
  }

  private dedupAmpCompoents(
    currentComponents: AmpComponentMap,
    newComponents: AmpComponentMap
  ): AmpComponentMap {
    const result = { ...currentComponents }
    for (const tag in newComponents) {
      const version = newComponents[tag]

      if (!result[tag] || result[tag] < version) {
        result[tag] = version
      }
    }

    return result
  }

  private formattedAmpScript(scripts: AmpComponentMap = {}): AmpScript {
    return Object.keys(scripts).map(name => ({
      name,
      version: scripts[name]
    }))
  }
}

export default AmpAssetPlugin
