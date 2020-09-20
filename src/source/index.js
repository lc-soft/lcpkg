const githubSource = require('./github')
const localSource = require('./local')
const npmSource = require('./npm')

const sourceList = [githubSource, localSource, npmSource];

async function resolvePackage(url, info) {
  const source = sourceList.find((item) => item.validate(url))
  if (source) {
    return await source.resolve(url, info)
  }
  return { name: url, version: 'latest', uri: `vcpkg:${url}` }
}

async function resolvePackages(urls, info) {
  return Promise.all(urls.map((arg) => {
    const [url, version] = arg.split('@')
    return resolvePackage(url, { ...info, version: version || 'latest' })
  }))
}

module.exports = {
  resolvePackage,
  resolvePackages
}
