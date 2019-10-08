const axios = require('axios')
const config = require('./config')

async function getRelease(owner, repo, version) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`

  async function getLatest() {
    console.log(`fetching ${url}/latest`)
    try {
      return (await axios.get(`${url}/latest`)).data
    } catch (err) {
      if (err.response.status !== 404) {
        throw new Error(`cannot fetch release info, message: ${err.response.data.message}`)
      }
    }
    try {
      return (await axios.get(url)).data[0]
    } catch (err) {
      throw new Error(`cannot fetch release info, message: ${err.response.data.message}`)
    }
  }

  if (!version) {
    return await getLatest()
  }
  console.log(`fetching ${url}/tags/v${version}`)
  try {
    return await axios.get(`${url}/tags/v${version}`).then(resolve)
  } catch (_err) {
    return await getLatest()
  }
}

function validate(url) {
  return url.indexOf('https://github.com/') === 0 || url.indexOf('github.com/') === 0
}

async function resolve(url, info) {
  const prefix = 'github.com/'
  const prefixIndex = url.indexOf(prefix)
  const splitIndex = prefixIndex === 0 ? prefixIndex + prefix.length : 0
  const [owner, repo] = url.substr(splitIndex).split('/')

  if (!owner || !repo) {
    throw new Error(`invalid github repository url: ${url}`)
  }

  const resolved = {}
  const release = await getRelease(owner, repo, info.version)

  release.assets.forEach((asset) => {
    const i = asset.name.lastIndexOf(config.packageFileExt)

    if (asset.name.length - config.packageFileExt.length === i)  {
      const triplet = asset.name.substr(0, i).split('_').pop()

      if (triplet) {
        resolved[triplet] = asset.browser_download_url
      }
    }
    resolved.all = asset.browser_download_url
  })
  return {
    name: repo,
    version: release.tag_name,
    uri: `github:${owner}/${repo}`,
    resolved
  }
}

module.exports = {
  validate,
  resolve
}
