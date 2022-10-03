// this script instantiates and seeds the sqlite database
// this prototype could be extended to server as a custom treasury event indexer

// sqlite client usage docs:
// https://www.npmjs.com/package/sqlite

import * as sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import * as incomeEvents from '../../output/output.json'

const main = async () => {
  try {
    sqlite3.verbose()
    const db = await open<sqlite3.Database, sqlite3.Statement>({
      filename: ':memory:',
      driver: sqlite3.Database,
    })

    // create income transactions table
    const q_CreateTable =
      'CREATE TABLE txs (id INTEGER PRIMARY KEY, amount REAL, from_addr TEXT, timestamp INTEGER, block_number INTEGER)'
    await db.exec(q_CreateTable)

    // seed table with data from income transactions JSON
    const q_InsertRow =
      'INSERT INTO txs (amount, from_addr, timestamp, block_number) VALUES (?, ?, ?, ?)'
    incomeEvents.forEach(async ev => {
      const eventVals = Object.keys(ev).map(key => ev[key])
      await db.run(q_InsertRow, eventVals)
    })

    // examples of data fetching
    const firstTransactionRecord = await db.get(
      'SELECT * FROM txs WHERE id = ?',
      [1]
    )

    const allTransactions = await db.all('SELECT * FROM txs')

    console.log({
      firstTransactionRecord,
      totalTransactionRecords: allTransactions.length,
    })

    // don't forget to close the db when yr done lol
    await db.close()
  } catch (error) {
    console.error(error)
  }
}

main()
