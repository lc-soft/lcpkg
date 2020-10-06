# [0.3.0](https://github.com/lc-soft/lcpkg/compare/v0.2.1...v0.3.0) (2020-10-06)


### Bug Fixes

* lcpkg is not defined ([24c48dd](https://github.com/lc-soft/lcpkg/commit/24c48ddac3640d9219ff453de6990d976ea05286))
* the setup command sets an incorrect vcpkg root directory ([9bd659b](https://github.com/lc-soft/lcpkg/commit/9bd659bedd151e64369299974c0ac29b90149241))


### Features

* add --save-source option ([196c47e](https://github.com/lc-soft/lcpkg/commit/196c47e1b07594d49118ba009799a3ea2a369076))
* add export command ([aa3ee1c](https://github.com/lc-soft/lcpkg/commit/aa3ee1c25c204e8410c8b85d3477a205cc87e149))
* add link command ([8658166](https://github.com/lc-soft/lcpkg/commit/8658166a1bfddedbbf2e47f13521d50ae00d0452))
* add npm source ([7342760](https://github.com/lc-soft/lcpkg/commit/7342760a826f6aaf34b38fb0861d90e31d61c5a7))
* add uninstall command ([60f46d3](https://github.com/lc-soft/lcpkg/commit/60f46d3c2011a46e5969c92c653fcf5c715c0f3e))
* add verbose output for install and uninstall commands ([703c719](https://github.com/lc-soft/lcpkg/commit/703c719bddd09931210a7952cdf7a5529662c920))
* move the packages directory to the user's home directory ([9f1838a](https://github.com/lc-soft/lcpkg/commit/9f1838aab2fbb312c896b325e9aa5699a73df269))
* remove the v prefix of the package version ([53fd07f](https://github.com/lc-soft/lcpkg/commit/53fd07fd7db3fbd9240c71a9053836ac310b51de))
* show download progress with multiple progress bars ([5c8de25](https://github.com/lc-soft/lcpkg/commit/5c8de253e4842a22907c86df49fb8bbea1303075))
* support using "pkg@version" to specify the package version ([11c788c](https://github.com/lc-soft/lcpkg/commit/11c788c2b8f731c8cbb5d5ff473a1a337bdc9c08))



## [0.2.1](https://github.com/lc-soft/lcpkg/compare/v0.2.0...v0.2.1) (2019-10-08)


### Bug Fixes

* sbstr -> substr ([eadab40](https://github.com/lc-soft/lcpkg/commit/eadab40d78e0286e5d662940602b54ac602ddf54))



# [0.2.0](https://github.com/lc-soft/lcpkg/compare/6e05b30564f3323f4236891ce2dd80ab5b858dca...v0.2.0) (2019-10-07)


### Bug Fixes

* **cli-install:** config file read failed ([b24f83e](https://github.com/lc-soft/lcpkg/commit/b24f83ea2bda95d5458c5a7e61ba8c43c7011ac2))
* **cli-install:** content directory collection is incorrect ([7e67791](https://github.com/lc-soft/lcpkg/commit/7e67791534297f9a02d05eb442028e0f8d0c8bf6))
* dependencies will be deleted after installing a package ([87cdf91](https://github.com/lc-soft/lcpkg/commit/87cdf910869c2e7efa3e1bb2eda04b47ca8199c8))
* no need to use the usage() output description ([f796721](https://github.com/lc-soft/lcpkg/commit/f796721e8c7b6fc261fc2e0933fc2b1c7a62387d))
* pack error ([20d4955](https://github.com/lc-soft/lcpkg/commit/20d495572d2d7074665fa2e3d111a34d540fcdd7))
* should update the dependencies after the installation ([ef79a04](https://github.com/lc-soft/lcpkg/commit/ef79a04ba1b43c48889985ee7a28c126262a3120))


### Features

* **cli-init:** set the default value of package.output to lcpkg/dist ([965d625](https://github.com/lc-soft/lcpkg/commit/965d62532dc8a516c7d0e7a408eb8cc2a43ab4ac))
* **cli-install:** add --platform option ([9a40c82](https://github.com/lc-soft/lcpkg/commit/9a40c82ed543ac4f6a03fbb11561675a94c9f8b6))
* **cli-pack:** remove old files before pack ([0081239](https://github.com/lc-soft/lcpkg/commit/008123989cd33aa8555bac54e348e4a489992c4f))
* add cli-init ([11dbd13](https://github.com/lc-soft/lcpkg/commit/11dbd138e795d908d5a0dd48969830bf2da8b2ec))
* add cli-run-script ([aef880a](https://github.com/lc-soft/lcpkg/commit/aef880a795ea30d9c8c59a95d7483b8cdadae193))
* add cli-setup ([00bebba](https://github.com/lc-soft/lcpkg/commit/00bebbaae1d086e09f1c96da8602f4f610fded0d))
* run script with arguments ([983920b](https://github.com/lc-soft/lcpkg/commit/983920b42ffe921afd2d36081cacea3341d2cba7))
* **cli-init:** use initial values from lcpkg.json ([ced5371](https://github.com/lc-soft/lcpkg/commit/ced53719910a1e94f9c608462f5a74ddcfb33faf))
* add --arch option ([f4c4443](https://github.com/lc-soft/lcpkg/commit/f4c444322d84b30be835b0f10b1c8242139b3a53))
* add cli-config ([193f827](https://github.com/lc-soft/lcpkg/commit/193f827b08361ac391ee7ed9ac3d4404cea3875d))
* add cli-install ([6e05b30](https://github.com/lc-soft/lcpkg/commit/6e05b30564f3323f4236891ce2dd80ab5b858dca))
* add cli-pack ([e517be8](https://github.com/lc-soft/lcpkg/commit/e517be80e5258d1cb3216d13f9e0af25457c64d8))
* print usage of packages ([0abfcbd](https://github.com/lc-soft/lcpkg/commit/0abfcbdc71f7ce8f54e4a7f83e25db6b9a3b899a))
* redesign package output ([60a14d9](https://github.com/lc-soft/lcpkg/commit/60a14d9cd31ea00f7f0779c9e8bbfd3aa2b2d4ff))
* support install package from github and local file ([0cc30be](https://github.com/lc-soft/lcpkg/commit/0cc30be2e4f4ad849b06f7a6edf73aba601d7e8d))
* support pack content directory ([a6d005d](https://github.com/lc-soft/lcpkg/commit/a6d005da39356ca0178f1e9cef4531ad8a1901a8))
* update USAGE.md file after installation ([4eb534e](https://github.com/lc-soft/lcpkg/commit/4eb534e67efb1f86a57ea083327767c9649f1056))
* **cli-pack:** add entry.targets configuration item ([8c2e6e0](https://github.com/lc-soft/lcpkg/commit/8c2e6e024e63a276d9af4106ed1d52243e9b1eeb))
* **cli-pack:** create packages for each platform and arch ([776db09](https://github.com/lc-soft/lcpkg/commit/776db09c9c65a45311ad81bd732a16a8833c202b))



