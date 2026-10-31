---
title: "The Math of Consistent Hashing"
slug: "math-of-consistent-hashing"
date: "2020-05-16"
tags:
  - "Distributed Systems"
  - "java"
description: "Why adding a node to a consistent hash ring only moves a fraction of the keys."
readingMinutes: 3
cover: null
coverCredit: null
---

With $n$ nodes on the ring, adding one node moves about $\frac{1}{n+1}$ of the keys.

The expected load on each node is:

$$
E[L] = \frac{K}{n}
$$

where $K$ is the number of keys.
