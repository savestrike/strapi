---
title: Webhooks
description: Webhooks are a way to send notifications to external services when certain events occur in a Strapi application
tags:
  - core
---

# Webhooks

## Overview

Webhooks are a way to send notifications to external services when certain events occur in a Strapi application. They are powered by the [event hub](event-hub.md)/.

You can find a complete list of Strapi webhook events in the [official documentation](https://docs.strapi.io/dev-docs/backend-customization/webhooks#available-events).

## Document Service triggered webhooks

Various document-related methods can trigger events when using the document service. below is a mapping of document methods to their corresponding webhook events:
The document service triggers the following events:

### Creating Documents:

`documents.create` triggers `entry.create`
If a document is published upon creation, it triggers both `entry.create` and `entry.publish`.

### Updating Documents:

`documents.update` leads to `entry.update`.
Updating a document to a published status triggers both `entry.update` and `entry.publish`.

### Deleting Documents:

`documents.delete` corresponds to `entry.delete`.

### Publishing Documents:

`documents.publish` directly maps to `entry.publish`.

### Unpublishing Documents:

`documents.unpublish` maps to `entry.unpublish`.

// callout

### Discarding Document Drafts:

`documents.discardDraft` translates to `entry.discardDraft`.`

### Payload

The payload of the event is an object with the following properties:

```ts
{
  event: string; // The name of the event
  model: string; // The name of the content type (e.g. 'article')
  uid: string; // The uid of the content type (e.g. 'api::article.article')
  entry: object; // The entry that was created, updated or deleted
}
```

All methods will have all fields deeply populated, meaning that all relational, media, component & dynamic zones fields will be available.

`delete` and `unpublish` methods are an exception, for performance reasons, the entry payload will contain the fields that the user populates during the request.
