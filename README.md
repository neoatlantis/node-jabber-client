NodeJS and Browser based Jabber Client
======================================

This aims at creating a NodeJS based Jabber/XMPP client, which provides a basic
API for any other programs who wants to implement a simple jabber client but
worries about the complex details dealing with XMPP protocol.

This NodeJS created client allows also direct browser access to the login'ed
accounts.

API Features
------------

* to login/logout a user
  the user's password is not able to be set using API. It is written in
  config file of this client and protected under a main passphrase.
* to retrive and refresh roster
* to push/pull messages from message queues
