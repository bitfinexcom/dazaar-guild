# dazaar-guild

![Dazaar logo](docs/logo.png)

> Socket, RPC API patterns for a decentralized web based on Dazaar 

```
npm install dazaar-guild
```

Learn more about Dazaar in our [intro blogpost](https://blog.dazaar.com/2020/09/12/introducing-dazaar/) and [whitepaper](./docs/whitepaper.md).

## Usage

Setup server side

```js
const { Bastion, Priv } = require('dazaar-guild')

const bastion = new Bastion({
  dir: './data',
  customValidate: (key, cb) => {
    console.log('bastion: validationRequest for', key.toString('hex'))
    cb(null)
  }
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
  dir: './data',
  customValidate: (key, cb) => {
    console.log('priv: validationRequest for', key.toString('hex'))
    cb(null)
  }
})

priv.on('message', p => {
  if (p.data === 'hello') {
    p.reply('world (priv)')
  }
})
```

And then client side

```js
const { Client } = require('dazaar-guild')

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
```

## API

#### `const bastion = Bastion(opts)`

Create a public Dazaar-Bastion instance.
`Bastion` inherits from EventEmitter.

Options include:

```js
{
  dir: ..., // data directory for hypercore storage
  customValidate: (key, cb) // custom client validation logic (ideal for whitelisting, ...)
}
```


#### `bastion.on('prv_auth', data => {...})`

Get notified on new client authentication request.

Data include:

```js
{
  cliPubHex: ..., // hex of pub key of connecting client
}
```

#### `bastion.on('message', data => {...})`

Generic message received from client, useful for chatter and build low level complex patterns (ie. RPC)

Data include:

```js
{
  data: ..., // incoming data
  reply: ..., // function to reply back to the client
}
```

#### `const priv = Priv(opts)`

Create a private Dazaar instance, dedicated to a single client.
`Priv` inherits from EventEmitter.

Options include:

```js
{
  dir: ..., // data directory for hypercore storage
  customValidate: (key, cb) // custom client validation logic (ideal for whitelisting, ...)
}
```

#### `priv.on('message', data => {...})`

Generic message received from client, useful for chatter and build low level complex patterns (ie. RPC)

Data include:

```js
{
  data: ..., // incoming data
  reply: ..., // function to reply back to the client
}
```
