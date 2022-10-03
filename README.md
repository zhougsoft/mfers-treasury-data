# mfers treasury data

> a script to ping the mfers treasury contract and parse it's related data

** warning: this is a WIP **

## to use

- install deps:
  - `npm install`
- serve the non-existent client lol:
  - `npm start`
- fetch & parse treasury contract income events, then save them to disk as json:
  - `npm run cache`
- spin up an in-memory sqlite database and seed with cached data (very WIP):
  - `npm run migrate-up`

use at own risk lol
