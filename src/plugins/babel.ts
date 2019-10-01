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

export default ampClassName
