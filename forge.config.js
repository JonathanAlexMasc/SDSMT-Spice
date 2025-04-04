// forge.config.js
const path = require('path');
module.exports = {
    packagerConfig: {
        asar: false,
        extraResource: ['bin', 'assets']
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-zip'
        },
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                bin: 'Habanero Spice'
            }
        },
        {
            name: '@electron-forge/maker-dmg',
            config: {
                bin: 'Habanero Spice'
            }
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                bin: 'Habanero Spice'
            }
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {
                bin: 'Habanero Spice'
            }
        }
    ],
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'JonathanAlexMasc',
                    name: 'SDSMT-Spice'
                },
                prerelease: false
            }
        }
    ]
};