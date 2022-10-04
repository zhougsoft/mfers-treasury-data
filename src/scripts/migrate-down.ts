// this script drops all tables

// sqlite client usage docs:
// https://github.com/kriasoft/node-sqlite#usage

import * as path from 'path'
import * as sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const main = async () => {
  try {
    sqlite3.verbose()
    const db = await open<sqlite3.Database, sqlite3.Statement>({
      filename: path.join(__dirname, '../db/database.db'),
      driver: sqlite3.Database,
    })

    // create income transactions table
    const q_DropTable = 'DROP TABLE txs'
    await db.exec(q_DropTable)

    // don't forget to close the db when yr done lol
    await db.close()
    console.log('db migrate down complete!')
  } catch (error) {
    console.error(error)
  }
}

main()
