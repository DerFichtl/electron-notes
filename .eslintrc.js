module.exports = {
    root: true,
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module'
    },
    env: {
        browser: false,
        node: false
    },
    extends: 'standard',
    globals: {
        __static: true
    },
    plugins: [
        'html'
    ],
    'rules': {
        "indent": "off",
        // "indent": ["error", 4],
        // allow paren-less arrow functions
        'arrow-parens': 0,
        // allow async-await
        'generator-star-spacing': 0,
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
    }
}
