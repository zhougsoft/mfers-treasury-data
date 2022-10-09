# mfers treasury data

> scripts to ping the mfers treasury contract and parse it's related data, along with an API and client to view it

## to use

- install deps:
  - `npm install`
- serve the client in dev mode:
  - `npm run dev`
- spin up sqlite database & seed with historical data:
  - `npm run migrate-up`
- (very WIP) fetch & parse treasury contract income events, then save them to disk as json:
  - `npm run cache`

good luck have fun! <3
