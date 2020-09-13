const githubSource = require('./github')
const localSource = require('./local')
const npmSource = require('./npm')

const sourceList = [githubSource, localSource, npmSource];

async function resolvePackage(url, info) {
  const source = sourceList.find((item) => item.validate(url));
  if (source) {
    return await localSource.resolve(url, info)
  }
  return { name: url, version: 'latest', uri: `vcpkg:${url}` }
}

async function resolvePackages(urls, info) {
  return Promise.all(urls.map(arg => resolvePackage(arg, info)))
}

module.exports = {
  resolvePackage,
  resolvePackages
}
