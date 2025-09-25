/// <reference types="@welldone-software/why-did-you-render" />
import React from 'react'
import whyDidYouRender from '@welldone-software/why-did-you-render'

if (import.meta.env.DEV) {
  console.log('🐛 Why-Did-You-Render is initializing...')
  console.log('📝 DEV mode:', import.meta.env.DEV)
  console.log('📦 React version:', React.version)
  
  whyDidYouRender(React, {
    trackAllPureComponents: false,
    trackHooks: true,
    trackExtraHooks: [[React, 'useEffect']],
    logOnDifferentValues: true,
    collapseGroups: true,
    include: [/.*/], // Track all components that have whyDidYouRender = true
    exclude: [],
  })
  
  console.log('✅ Why-Did-You-Render initialized successfully!')
  console.log('💡 To track a component, add: ComponentName.whyDidYouRender = true')
}
