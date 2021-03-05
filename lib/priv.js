const debug = require('debug')('dgw:priv')
const EventEmitter = require('events')

const _ = require('lodash')
const hypercore = require('hypercore')
const market = require('dazaar/market')
const swarm = require('dazaar/swarm')

class Priv extends EventEmitter {
  constructor (conf) {
    super()

    this.conf = conf

  }

  servePriv (msg, cb) {
    const cliPubHex = msg.cliPubHex
    const cliPub = Buffer.from(msg.cliPubHex, 'hex')

    const cliPrivFeed = hypercore(this.conf.dir + `/feed-prv-${cliPubHex}`)
    const cliPrivMkt = market(this.conf.dir + `/mkt-prv-${cliPubHex}`)

    const customValidate = this.conf.customValidate

    const cliPriv = this.cliPriv = cliPrivMkt.sell(cliPrivFeed, {
      validate (remoteKey, cb) {
        if (customValidate) {
          return customValidate(remoteKey, cb)
        }

        cb(null)
      }
    })

    cliPriv.receive('message', (msg, from) => {
      this.emit('message', {
        data: msg,
        reply: data => {
          this.cliPriv.send('message', data, from)
        },
        from
      })
    })

    cliPriv.ready(err => {
      if (err) {
        throw err
      }

      debug(`cliPriv(${cliPubHex}) -> ready`)
      cliPrivFeed.append('connected')
    })

    swarm(cliPriv, () => {
      debug(`cliPriv(${cliPubHex}) -> swarm connected`)
      if (cb) {
        cb()
      }
    })
  }
}

module.exports = Priv
