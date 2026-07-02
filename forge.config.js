module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'PrompterPro',
    appCopyright: 'Yazaifan',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'PrompterPro',
        setupExe: 'PrompterPro-Setup.exe',
        noMsi: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
};
