# Chat using GraphQL Subscription

## Summary

A livestream can have two types of message threads(chats) - public and private.

Public message thread is created in default when a live stream is added.

```js
addLiveStream
```

Private message thread is created when a user join the live stream.

```js
joinLiveStream
```

## API Usage

- to load message threads(chats):
use the below query.
```js
messageThreads
```
- to add a message to a message thread:

use the below mutation.
```js
addMessage
```

- to listen to the message threads:

use the below subscription.
```js
messageAdded
```
