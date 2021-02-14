const Bastion = require('./../lib/bastion')
const Priv = require('./../lib/priv')

const bastion = new Bastion({
  dir: './data'
})

const MEM = {}

bastion.on('prv_auth', data => {
  if (MEM[data.cliPubHex]) {
    console.error('cli already active', cliPubHex)
    return
  }

  MEM[data.cliPubHex] = true
  priv.servePriv({
    cliPubHex: data.cliPubHex
  }, () => {
  data.confirm()
  })
})

bastion.on('message', p => {
  if (p.data === 'hello') {
    p.reply('world')
  }
})

bastion.start()

const priv = new Priv({
  dir: './data'
})

priv.on('message', p => {
  console.log('EHERERE', p)
  if (p.data === 'hello') {
    p.reply('world (priv)')
  }
})
