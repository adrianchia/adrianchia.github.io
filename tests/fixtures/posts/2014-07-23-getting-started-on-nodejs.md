---
title: "Getting Started on NodeJS"
slug: "2014-07-23-getting-started-on-nodejs"
date: "2014-07-23"
tags:
  - "nodejs"
  - "express"
description: "Node.js lets you run JavaScript on the server. Here is the smallest possible web server."
readingMinutes: 2
cover: null
coverCredit: null
---

Node.js lets you run JavaScript on the server. Here is the smallest possible web server:

```js title="server.js"
const http = require('http');

http.createServer((req, res) => {
  res.end('Hello World');
}).listen(3000);
```

Run it with `node server.js` and open your browser at `http://localhost:3000`.
