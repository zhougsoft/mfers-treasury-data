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

    app.get('/api/txs', async (req, res) => {
      const txs = await db.all('SELECT * FROM txs')
      res.json({ txs })
    })

    app.get('/api/txs/:id', async (req, res) => {
      const { id } = req.params
      const tx = await db.get('SELECT * FROM txs WHERE id = ?', [id])
      res.json({ tx })
    })

    // TODO: use the query in the route as an example
    // set up a route with  `from` and `to` params to filter on dates
    app.get('/api/dates', async (req, res) => {
      const txs = await db.all(
        "SELECT datetime(timestamp, 'unixepoch') as date FROM txs"
      )
      res.json({ txs })
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
