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

    // get all txs, optionally by date
    app.get('/api/txs', async (req, res) => {
      // if date query params passed, filter results by date
      if (req.query) {
        const { from, to } = req.query

        // TODO: validate the date input from sender

        // api/txs?from=YYYY-MM-DD&to=YYYY-MM-DD
        if (from && to) {
          const q_AllTxsFromTo =
            "SELECT * from txs WHERE datetime(timestamp, 'unixepoch') BETWEEN ? and ?"
          const txs = await db.all(q_AllTxsFromTo, [from, to])
          console.log(`fetched ${txs.length} txs`)
          res.json({ result_count: txs.length, txs })
          return
        }

        // api/txs?from=YYYY-MM-DD
        if (from) {
          const q_AllTxsFrom =
            "SELECT * from txs WHERE datetime(timestamp, 'unixepoch') > ?"
          const txs = await db.all(q_AllTxsFrom, [from])
          console.log(`fetched ${txs.length} txs`)
          res.json({ result_count: txs.length, txs })
          return
        }

        // api/txs?&to=YYYY-MM-DD
        if (to) {
          const q_AllTxsFrom =
            "SELECT * from txs WHERE datetime(timestamp, 'unixepoch') < ?"
          const txs = await db.all(q_AllTxsFrom, [to])
          console.log(`fetched ${txs.length} txs`)
          res.json({ result_count: txs.length, txs })
          return
        }
      }

      // no parameters, return all tx records
      const txs = await db.all('SELECT * FROM txs')
      console.log(`fetched all ${txs.length} txs`)
      res.json({ result_count: txs.length, txs })
    })

    // get tx by id
    app.get('/api/txs/:id', async (req, res) => {
      const { id } = req.params
      const tx = await db.get('SELECT * FROM txs WHERE id = ?', [id])
      console.log(`fetched tx id #${id}`)
      res.json({ tx })
    })

    // start express server
    app.listen(PORT, () => {
      console.log('express server running on port ' + PORT)
    })
  } catch (error) {
    console.error(error)
  }
}

main()
