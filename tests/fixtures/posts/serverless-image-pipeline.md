---
title: "Building a Serverless Image Pipeline on AWS"
slug: "serverless-image-pipeline"
date: "2020-08-28"
tags:
  - "aws"
  - "integration"
description: "Resizing uploads with S3 events and Lambda, without running a single server."
readingMinutes: 4
cover: "/og/covers/serverless-image-pipeline.jpg"
coverCredit:
  text: "Photo by Jane Doe on Unsplash"
  url: "https://unsplash.com/"
---

Uploads land in an S3 bucket, an event triggers a Lambda function, and the resized image goes to a second bucket.

![Architecture diagram](/images/posts/serverless-image-pipeline/architecture.png)

The whole pipeline costs nothing while idle.
