module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "plugins": [
        "disable",
        "hapi",
        "security",
    ],
    "extends": ["plugin:security/recommended", "eslint:recommended"],
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 9
    },
    "settings": {
        "eslint-plugin-disable": {
            "paths": {
                "security": [],
            }
        }
    },
    "rules": {
        "no-multiple-empty-lines": [
          "error",
          { "max": 2, "maxBOF": 0, "maxEOF": 1 }
        ],
        "hapi/hapi-capitalize-modules": [
          "error"
        ],
        "no-unused-vars": [
            "error",
            { "vars": "all", "args": "none"}
        ],
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "eqeqeq": 2,
        "quotes": [
            "off",
            "double"
        ],
        "semi": [
            "warn",
            "never"
        ],
        // "security/*": 2,
        "no-console": ["warn"],
        "no-redeclare": ["error", { "builtinGlobals": true }]
    }
};
