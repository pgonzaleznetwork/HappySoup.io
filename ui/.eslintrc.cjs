/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: ['plugin:vue/vue3-essential', 'eslint:recommended', '@vue/eslint-config-prettier'],
    parserOptions: {
        ecmaVersion: 'latest'
    },
    ignorePatterns: ['nuxt.config.js', 'index.js'],
    rules: {
        'vue/multi-word-component-names': 'off',
        'vue/no-reserved-component-names': 'off',
        'vue/component-tags-order': [
            'error',
            {
                order: ['script', 'template', 'style']
            }
        ],
        'vue/html-self-closing': [
            'error',
            {
                html: {
                    void: 'any',
                    normal: 'always',
                    component: 'always'
                },
                svg: 'always',
                math: 'always'
            }
        ],
        'vue/no-parsing-error': 'off',
        'vue/valid-v-bind': 'off',
        'vue/no-reserved-keys': [
            'error',
            {
                reserved: ['$el', '$nextTick', '$ref', '$refs', '$slots', '$store'],
                groups: []
            }
        ]
    }
};
