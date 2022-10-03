import { Database } from 'sqlite'
import * as sqlite from 'sqlite3'

const db = new Database({
  driver: sqlite.Database,
  filename: ':memory:',
})

export default db
