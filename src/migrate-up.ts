import * as sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// using sqlite - a promise-based wrapper for sqlite3 library
// docs: https://www.npmjs.com/package/sqlite

const main = async () => {
  try {
    sqlite3.verbose()
    const db = await open<sqlite3.Database, sqlite3.Statement>({
      filename: ':memory:',
      driver: sqlite3.Database,
    })

    const q_CreateTable =
      'CREATE TABLE stash (id INTEGER PRIMARY KEY, val CHAR);'

    const q_SeedTable =
      "INSERT INTO stash (val) VALUES ('hello'), ('hi'), ('how r u')"

    await db.exec(q_CreateTable)
    await db.exec(q_SeedTable)
    const rowResult = await db.get('SELECT * FROM stash WHERE id = ?', [1])
    const allRowsResult = await db.all('SELECT * FROM stash')

    console.log({ rowResult, allRowsResult })

    await db.close()
  } catch (error) {
    console.error(error)
  }
}

main()
