import * as path from 'path'
import * as express from 'express'
import { connectDb } from './db/config'

const PORT = 5000

const main = async () => {
  try {
    // connect to the sqlite database
    const db = await connectDb()

    // setup express server
    const app = express()
    const publicPath = path.join(__dirname, '../public')
    app.use(express.static(publicPath, { extensions: ['html'] }))

    // TODO: setup router here and wire up these queries to routes
    // const firstTx = await db.get('SELECT * FROM txs WHERE id = ?', [1])
    // const allTxs = await db.all('SELECT * FROM txs')

    // start express server
    app.listen(PORT, () => {
      console.log('express server running on port ' + PORT)
    })
  } catch (error) {
    console.error(error)
  }
}

main()
