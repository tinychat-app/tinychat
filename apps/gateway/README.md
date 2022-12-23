# gateway

tinychat's api gateway for real-time communication

## Installation

A redis or keydb server needs to be running for the `gateway` to communicate with `rest`.

To run one with docker use `docker run --name some-keydb -p 6379:6379 -d eqalpha/keydb`

Additionally the [rest api](https://github.com/tinychat-app/api) needs to be running, to respond to the gateway's auth confirmation requests.

First install the dependencies:

```bash
yarn install
```

Then start the server

```bash
yarn dev
```

By default the server will run on port 8080

### Docker

A Dockerfile is included to build a docker image.

```bash
docker build -t tinychat-app/gateway .
```

Then run the image

```bash
docker run --init -p 8080:8080 tinychat-app/gateway
```

## Usage

Connect to the gateway with a websocket client.

You will receive a `"op": "hello"` message. You should not attempt to `init` before you have received this message.

After receiving the `hello` message you can `init` the connection with the following message:

```json
{
    "op": "init",
    "token": "your token"
}
```

If the token is valid you will receive a `"op": "ready"` message.

If you make any errors while being connected to the gateway, the gateway will try to send you a `"op": "error"` message, usually this is a non-fatal error and you can continue to using the connection. In the case the error is fatal, the gateway will close the connection.

The gateway will always send a message in the error message detailing what went wrong.

Error message:

```jsonc
{
    "op": "error",
    "data": {
        "fatal": true, // or false if the error is non-fatal
        "message": "..."
    }
}
```
