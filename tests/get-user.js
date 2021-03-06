// test route to GET a user

const tap = require('tap')
const request = require('supertest')
const jwt = require('jsonwebtoken')

process.env.NODE_ENV = 'development'

const main = async () => {
  let app

  await tap.test('Environment variables are set', async () => {
    await tap.type(process.env.ISSUER, 'string')
    await tap.type(process.env.SECRETORKEY, 'string')
  })

  await tap.test('App exists', async () => {
    app = require('../server').app
    await tap.type(app, 'function')
  })

  await tap.test('GET /<userid> with no authentication', async () => {
    const res = await request(app)
      .get('/foo')
      .set('Host', 'reader-api.test')

    await tap.equal(res.statusCode, 401)
  })

  await tap.test("GET /<userid> with other user's authentication", async () => {
    const options = {
      subject: 'bar',
      expiresIn: '24h',
      issuer: process.env.ISSUER
    }

    const token = jwt.sign({}, process.env.SECRETORKEY, options)

    const res = await request(app)
      .get('/foo')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)

    await tap.equal(res.statusCode, 403)
  })

  await tap.test('GET /<userid>', async () => {
    await tap.type(process.env.ISSUER, 'string')

    const options = {
      subject: 'foo',
      expiresIn: '24h',
      issuer: process.env.ISSUER
    }

    await tap.type(process.env.SECRETORKEY, 'string')

    const token = jwt.sign({}, process.env.SECRETORKEY, options)

    const res = await request(app)
      .get('/foo')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)

    await tap.equal(
      res.get('Content-Type'),
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

    const body = res.body

    await tap.ok(Array.isArray(body['@context']))
    await tap.equal(body['@context'].length, 2)
    await tap.equal(
      body['@context'][0],
      'https://www.w3.org/ns/activitystreams'
    )
    await tap.type(body['@context'][1], 'object')
    await tap.equal(
      body['@context'][1].reader,
      'https://rebus.foundation/ns/reader'
    )

    await tap.equal(body.id, 'https://reader-api.test/foo')
    await tap.equal(body.type, 'Person')
    await tap.equal(body.outbox, 'https://reader-api.test/foo/activity')
    await tap.equal(typeof body.followers, 'undefined')
    await tap.equal(typeof body.following, 'undefined')
    await tap.equal(typeof body.liked, 'undefined')
    await tap.type(body.streams, 'object')
    await tap.equal(body.streams.id, 'https://reader-api.test/foo/streams')
    await tap.equal(body.streams.type, 'Collection')
    await tap.type(body.streams.summaryMap, 'object')
    await tap.type(body.streams.summaryMap.en, 'string')

    await tap.equal(body.streams.totalItems, 1)
    await tap.ok(Array.isArray(body.streams.items))
    await tap.equal(body.streams.items.length, 1)

    const library = body.streams.items[0]

    await tap.type(library, 'object')
    await tap.equal(library.id, 'https://reader-api.test/foo/library')
    await tap.equal(library.type, 'Collection')
    await tap.type(library.summaryMap, 'object')
    await tap.type(library.summaryMap.en, 'string')
    await tap.type(library.totalItems, 'number')
  })
}

main()
