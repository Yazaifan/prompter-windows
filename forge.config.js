module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'PrompterPro',
    appCopyright: '牙大哥',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'PrompterPro',
        setupExe: 'PrompterPro-Setup.exe',
        noMsi: false,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
};
