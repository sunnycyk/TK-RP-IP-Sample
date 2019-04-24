const Cloudinary = require('cloudinary')
const FS = require('fs')
const Uuid = require('uuid')
const Config = require('../config')

const resource_type = 'raw'

const remoteStorage = {}
const localStorage = {}

module.exports = process.env.CLOUDINARY_URL ? remoteStorage : localStorage

remoteStorage.upload = localPath => new Promise((resolve, reject) => {
  const public_id = Uuid.v4()
  Cloudinary.v2.uploader.upload(localPath, {public_id, resource_type}, (error, _) => {
    if (error) reject(error)
    else resolve(public_id)
  })
})

remoteStorage.getUrl = public_id => Cloudinary.url(public_id, {resource_type})

localStorage.upload = localPath => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const data = FS.readFileSync(localPath)
  const name = Uuid.v4()
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    FS.writeFile(`public/${name}`, data, err => {
      if (err) {
        reject(err)
      } else {
        resolve(name)
      }
    })
  })
}

localStorage.getUrl = name => `${Config.host}/${name}`
