const debug = require('debug')('dgw:bastion')
const fs = require('fs')
const EventEmitter = require('events')

const _ = require('lodash')
const async = require('async')
const hypercore = require('hypercore')
const market = require('dazaar/market')
const swarm = require('dazaar/swarm')

class Bastion extends EventEmitter {
  constructor (conf, srv) {
    super()
    this.conf = conf
    _.extend(this, srv)
  }

  start () {
    const mainFeed = this.mainFeed = hypercore('./data/feed-main')
    mainFeed.append('init')

    const gwMkt = this.gwMkt = market('./data/mkt-gw')

    const gw = this.gw = gwMkt.sell(mainFeed, {
      validate (remoteKey, cb) {
        cb(null)
      }
    })

    gw.receive('auth', (msg, from) => {
      this.handleAuth(msg, from)
    })

    gw.receive('message', (msg, from) => {
      this.emit('message', {
        data: msg,
        reply: data => {
          this.gw.send('message', data, from)
        }
      })
    })

    gw.ready(err => {
      if (err) {
        throw err
      }

      debug('bastion -> inited', gw.key.toString('hex'))
      this.emit('connected', gw.key)
    })

    swarm(gw, () => {
      debug('bastion -> swarm connected')
    })
  }

  async handleAuth (msg, from) {
    const pubKey = from.remotePublicKey
    const cliPubHex = pubKey.toString('hex')

    const hcFeedPath = this.conf.dir + `/feed-prv-${cliPubHex}`
 
    const done = (cliKeyHex) => {
      this.emit('prv_auth', {
        cliPubHex: cliPubHex,
        confirm: () => {
          debug(`bastion -> auth confirm (${cliPubHex})`)
          this.gw.send('auth', {
            key: cliKeyHex
          }, from)
        }
      })
    }

    const prep = () => {
      const cliPrivFeed = hypercore(hcFeedPath)
      const cliPrivMkt = market(this.conf.dir + `/mkt-prv-${cliPubHex}`)

      const cliPriv = cliPrivMkt.sell(cliPrivFeed, {
        validate (remoteKey, cb) {
          cb(null)
        }
      })

      cliPriv.ready(async err => {
        debug(`cliPriv(${cliPubHex}) -> inited`)

        async.series([
          next => {
            cliPrivFeed.close(next)
          },
          next => {
            cliPrivMkt.destroy(next)
          }
        ], () => {
          const cliKeyHex = cliPriv.key.toString('hex')
          fs.writeFile(hcFeedPath + '-auth', cliKeyHex, () => {})
          done(cliKeyHex)
        })
      })
    }
   
    fs.stat(hcFeedPath, (err, res) => {
      if (res) {
        fs.readFile(hcFeedPath + '-auth', 'utf8', (err, cliKeyHex) => {
          console.log('READFILE', cliKeyHex)
          done(cliKeyHex)
        })
        return
      }

      prep()
    })
  }
}

module.exports = Bastion
