const debug = require('debug')('dgw:cli')

const EventEmitter = require('events')
const market = require('dazaar/market')
const swarm = require('dazaar/swarm')

class Client extends EventEmitter {
  constructor (conf) {
    super()

    this.conf = conf
  }

  start () {
    const cli = this.cli = market(`./data/mkt-cli-${this.conf.bastionKey}`)
    const buyer = this.buyer = cli.buy(Buffer.from(this.conf.bastionKey, 'hex'))

    buyer.once('validate', () => {
      debug('buyerPub -> validated')
      this.emit('pub_validated')
    })

    buyer.receive('auth', msg => {
      debug('buyer got auth msg', msg)
      this.emit('auth', msg)
    })

    buyer.receive('message', msg => {
      this.emit('message', msg)
    })

    buyer.ready(err => {
      debug('buyerPub -> ready')
    })

    swarm(buyer, () => {
      debug('buyerPub -> swarm connected')
      this.emit('pub_connected')
    })
  }

  bcastPub (a, o) {
    this.buyer.broadcast(a, o)
  }

  bcastPriv (a, o) {
    this.buyerPriv.broadcast(a, o)
  }

  auth () {
    this.bcastPub('auth', 'hello')
  }

  connectPriv (msg, cb) {
    const cliPriv = this.cliPriv = market(`./data/mkt-cli-${msg.key}`)
    const buyerPriv = this.buyerPriv = cliPriv.buy(Buffer.from(msg.key, 'hex'))

    buyerPriv.once('validate', () => {
      debug('buyerPrv -> validated')
      this.emit('prv_validated')
    })

    buyerPriv.on('feed', feed => {
      debug('buyerPriv -> feed inited')

      feed.on('download', (ix, msg) => {
        msg = msg.toString('utf8')
        debug('buyerPriv -> download', ix, msg)
      })
    })

    buyerPriv.receive('message', msg => {
      this.emit('prv_message', msg)
    })

    buyerPriv.ready(() => {
      debug('buyerPriv -> ready')
    })

    swarm(buyerPriv, () => {
      debug('buyerPriv -> swarm connected')
      this.emit('prv_connected')
    })
  }
}

module.exports = Client
