const express = require('express')
const router = express.Router()
const passport = require('passport')
const { getId } = require('../utils/get-id.js')

router.get(
  '/:nickname/activity/:actid',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    const nickname = req.params.nickname
    const actid = req.params.actid

    if (req.user !== nickname) {
      res.status(403).send(`Access to activity ${actid} disallowed`)
      return
    }

    res.setHeader(
      'Content-Type',
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

    let act = null

    if (actid.match(/create/)) {
      act = {
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          { reader: 'https://rebus.foundation/ns/reader' }
        ],
        summaryMap: {
          en: `${nickname} created 'Publication 1'`
        },
        type: 'Create',
        id: getId(`/${nickname}/activity/${actid}`),
        actor: {
          id: getId(`/${nickname}/`),
          type: 'Person',
          summaryMap: {
            en: `User with nickname ${nickname}`
          }
        },
        object: {
          type: 'reader:Publication',
          id: getId(`/${nickname}/publication/1`),
          name: `Publication 1`,
          totalItems: 4
        }
      }
    } else {
      act = {
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          { reader: 'https://rebus.foundation/ns/reader' }
        ],
        summaryMap: {
          en: `${nickname} `
        },
        type: 'Read',
        id: getId(`/${nickname}/activity/${actid}`),
        actor: {
          id: getId(`/${nickname}/`),
          type: 'Person',
          summaryMap: {
            en: `User with nickname ${nickname}`
          }
        },
        object: {
          type: 'Document',
          id: getId(`/${nickname}/publication/1/document/1`),
          name: `Publication 1 Document 1`
        }
      }
    }

    res.end(JSON.stringify(act))
  }
)

module.exports = router
