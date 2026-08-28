import '@testing-library/jest-dom/vitest'

const originalGetComputedStyle = window.getComputedStyle
window.getComputedStyle = ((element: Element, pseudo?: string | null) => {
  // jsdom 30 does not expose a CSS declaration for MathML nodes emitted by KaTeX.
  // Testing Library only needs visibility while walking role candidates.
  if (element.namespaceURI === 'http://www.w3.org/1998/Math/MathML' && !(element as HTMLElement).style) {
    return {
      visibility: 'visible',
      length: 0,
      getPropertyValue: () => '',
      getPropertyPriority: () => '',
      item: () => '',
    } as unknown as CSSStyleDeclaration
  }
  return originalGetComputedStyle.call(window, element, pseudo)
}) as typeof window.getComputedStyle
