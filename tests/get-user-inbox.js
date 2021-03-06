// test route to GET a user inbox

const tap = require('tap')
const request = require('supertest')
const jwt = require('jsonwebtoken')

// XXX: here to keep the app from bouncing to https

process.env.NODE_ENV = 'development'

const main = async () => {
  await tap.test('Environment variables are set', async () => {
    await tap.type(process.env.ISSUER, 'string')
    await tap.type(process.env.SECRETORKEY, 'string')
  })

  let app = null
  await tap.test('App exists', async () => {
    app = require('../server').app
    await tap.type(app, 'function')
  })

  await tap.test('GET /<userid>/inbox with no authentication', async () => {
    const res = await request(app)
      .get('/foo/inbox')
      .set('Host', 'reader-api.test')

    await tap.equal(res.statusCode, 401)
  })

  await tap.test('GET /<userid>/inbox as other user', async () => {
    const options = {
      subject: 'bar',
      expiresIn: '24h',
      issuer: process.env.ISSUER
    }

    const token = jwt.sign({}, process.env.SECRETORKEY, options)

    const res = await request(app)
      .get('/foo/inbox')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)

    await tap.equal(res.statusCode, 403)
  })

  await tap.test(
    'GET /<userid>/inbox with correct authentication',
    async () => {
      const options = {
        subject: 'foo',
        expiresIn: '24h',
        issuer: process.env.ISSUER
      }

      const token = jwt.sign({}, process.env.SECRETORKEY, options)

      const res = await request(app)
        .get('/foo/inbox')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)

      await tap.equal(res.statusCode, 200)

      await tap.equal(
        res.get('Content-Type'),
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

      const body = res.body

      await tap.type(body, 'object')

      await tap.equal(body['@context'], 'https://www.w3.org/ns/activitystreams')
      await tap.equal(body.id, 'https://reader-api.test/foo/inbox')
      await tap.equal(body.type, 'OrderedCollection')
      await tap.ok(Array.isArray(body.orderedItems))
      await tap.equal(body.totalItems, 0)
      await tap.equal(body.orderedItems.length, 0)
    }
  )
}

main()
