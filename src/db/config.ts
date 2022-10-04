import * as fs from 'fs'
import * as path from 'path'
import * as sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export const connectDb = async () => {
  // make sure db file exists before trying to connect
  const dbPath = path.join(__dirname, 'db', 'database.db')
  if (!fs.existsSync(dbPath))
    throw Error(
      'src/db/database.db file not found - run `npm migrate-up` to create the db file!'
    )

  // connect & return sqlite client
  sqlite3.verbose()
  const db = await open<sqlite3.Database, sqlite3.Statement>({
    filename: dbPath,
    driver: sqlite3.Database,
  })
  return db
}
