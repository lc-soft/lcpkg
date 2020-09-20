const axios = require('axios')
const path = require('path')
const config = require('../config')

async function getRelease(owner, repo, version) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`

  async function getLatest() {
    console.log(`fetching ${url}/latest`)
    try {
      return (await axios.get(`${url}/latest`)).data
    } catch (err) {
      if (err.response.status !== 404) {
        throw err
      }
    }
    console.log(`try to get the last version in ${url}`)
    return (await axios.get(url)).data[0]
  }

  if (!version) {
    return getLatest()
  }
  console.log(`fetching ${url}/tags/v${version}`)
  return (await axios.get(`${url}/tags/v${version}`)).data
}

function validate(url) {
  return url.indexOf('https://github.com/') === 0 || url.indexOf('github.com/') === 0
}

async function resolve(url, info) {
  const prefix = 'github.com/'
  const prefixIndex = url.indexOf(prefix)
  const splitIndex = prefixIndex === 0 ? prefixIndex + prefix.length : 0
  const [owner, repo] = url.substr(splitIndex).split('/')
  const resolved = {}
  let release

  if (!owner || !repo) {
    throw new Error(`invalid github repository url: ${url}`)
  }

  try {
    release = await getRelease(owner, repo, info.version)
  } catch (err) {
    throw new Error(`cannot fetch release info, message: ${err.message}`)
  }
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
