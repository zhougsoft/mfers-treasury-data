// load treasury JSON data into pocketbase db
// https://pocketbase.io/docs

import PocketBase from 'pocketbase'
import * as txs from './data/income-events.json'

const DB_URL = 'http://localhost:8090'
const DB_USER = 'zhoug@email.com'
const DB_PASS = 'password123'


// TODO:
const DB_SCHEMA = {
  name: 'treasury-income',
  schema: [
    {
      name: 'amount',
      type: 'number',
    },
    {
      name: 'from',
      type: 'text',
    },
    {
      name: 'timestamp',
      type: 'number',
    },
    {
      name: 'block_number',
      type: 'number',
    },
  ],
}

const main = async () => {
  // create & auth sdk client
  const client = new PocketBase(DB_URL)
  await client.admins.authViaEmail(DB_USER, DB_PASS)

  // create the collection as-per schema
  await client.collections.create(DB_SCHEMA)
}

main()
