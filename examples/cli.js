const { Client } = require('../index')

const client = new Client({
  bastionKey: process.argv[2]
}, {
})

client.start()

client.on('message', p => {
  console.log('received pub message', p)
})

client.on('pub_connected', () => {
  client.bcastPub('message', 'hello')
  client.auth()
})

client.on('auth', msg => {
  console.log('received authentication handshake')
  client.connectPriv(msg)
})

client.on('prv_message', p => {
  console.log('received prv message', p)
})

client.on('prv_connected', () => {
  setTimeout(() => {
    client.bcastPriv('message', 'hello')
  }, 500)
  console.log('connected priv')
})
