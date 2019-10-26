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
  excludeJsResourcesRegExp?: ExcludeResourcesRegExp
  excludeCssResourcesRegExp?: ExcludeResourcesRegExp
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
  private excludeJsResourcesRegExp: ExcludeResourcesRegExp
  private excludeCssResourcesRegExp: ExcludeResourcesRegExp
  private ampComponentMap: object

  public constructor(options: Options) {
    this.filename = options.filename
    this.includeEntries = options.includeEntries || []
    this.excludeEntries = options.excludeEntries || []
    this.excludeJsResourcesRegExp = options.excludeJsResourcesRegExp
    this.excludeCssResourcesRegExp = options.excludeCssResourcesRegExp
    this.ampComponentMap = {}
  }

  public apply(compiler) {
    compiler.hooks.emit.tapAsync('AmpAssetsPlugin', (compilation, callback) => {
      this.ampComponentMap = {}
      const result = {}
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
          const modules = chunk.getModules() || []

          for (let i = 0; i < modules.length; i++) {
            const module = modules[i]
            const moduleType = module.constructor.name

            if (moduleType === 'ConcatenatedModule') {
              for (const concatennation of module._orderedConcatenationList) {
                const { type, module } = concatennation
                if (type !== 'concatenated') {
                  continue
                }

                const { request } = module

                if (javascriptRegex.test(request)) {
                  scripts = this.findAmpComponentFromNormalModule(
                    module,
                    scripts
                  )
                }

                if (cssRegex.test(request)) {
                  css = this.findCssFromNormalModule(module, css)
                }
              }
            } else if (moduleType === 'NormalModule') {
              const { request } = module

              if (javascriptRegex.test(request)) {
                scripts = this.findAmpComponentFromNormalModule(module, scripts)
              }

              if (cssRegex.test(request)) {
                css = this.findCssFromNormalModule(module, css)
              }
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

  private findAmpComponentFromNormalModule(
    module: object,
    scripts: AmpComponentMap
  ): AmpComponentMap {
    // @ts-ignore
    const { request, _source } = module

    if (
      !_source ||
      (this.excludeJsResourcesRegExp &&
        this.excludeJsResourcesRegExp.test(request))
    ) {
      return scripts
    }

    if (this.ampComponentMap[request]) {
      return this.dedupAmpCompoents(scripts, this.ampComponentMap[request])
    } else {
      const newAmpComponents = this.findAmpComponents(_source.source())

      if (newAmpComponents) {
        this.ampComponentMap[request] = newAmpComponents
        return this.dedupAmpCompoents(scripts, newAmpComponents)
      }
    }

    return scripts
  }

  private findCssFromNormalModule(normalModule: object, css: string): string {
    // @ts-ignore
    const { request, dependencies = [] } = normalModule
    if (
      this.excludeCssResourcesRegExp &&
      this.excludeCssResourcesRegExp.test(request)
    ) {
      return css
    }

    for (const dependency of dependencies) {
      const module = dependency.module
      const moduleType = module.constructor.name

      if (moduleType !== 'CssModule') {
        continue
      }

      css += module.content
        .replace(/\/\*[^*]*\*+([^\/][^*]*\*+)*\//g, '')
        .replace(/\r?\n/g, '')
    }

    return css
  }
}

export default AmpAssetPlugin
