const types = require('@babel/types')

function ampClassName() {
  return {
    visitor: {
      JSXOpeningElement(path) {
        // https://github.com/facebook/jsx/blob/master/AST.md#jsx-boundary-tags
        const { name = {}, attributes = [] } = path.node
        const { type = '', name: tag = '' } = name

        if (type !== 'JSXIdentifier' || !tag.startsWith('amp-')) {
          return
        }

        for (let i = 0; i < attributes.length; i++) {
          const { type: attributesType, name: attributesName } = attributes[i]
          if (attributesType !== 'JSXAttribute') {
            continue
          }

          if (attributesName.name === 'className') {
            attributesName.name = 'class'
          }
        }
      }
    }
  }
}

function flatternImport() {
  return {
    visitor: {
      ImportDeclaration(path, state = { opts: {} }) {
        // https://babeljs.io/docs/en/babel-types#importdeclaration
        const { specifiers, source } = path.node
        const option = state.opts[source.value]

        if (!option) {
          return
        }

        const validImports = specifiers.filter(
          ({ type }) => type === 'ImportSpecifier'
        )

        if (!validImports.length) {
          return
        }

        const transforms = []

        validImports.forEach(declaration => {
          const { imported, local } = declaration
          const newImportPath = `${option.importPath}${imported.name}`

          transforms.push(
            types.importDeclaration(
              [types.importDefaultSpecifier(types.identifier(local.name))],
              types.stringLiteral(newImportPath)
            )
          )
        })

        if (transforms.length > 0) {
          path.replaceWithMultiple(transforms)
        }
      }
    }
  }
}

export { ampClassName, flatternImport }
