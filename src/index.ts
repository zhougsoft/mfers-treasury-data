import * as path from 'path'
import * as express from 'express'

const PORT = 5000

// setup express server
const app = express()
const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath, { extensions: ['html'] }))
// app.use((req, res) => res.redirect('/'))

// start express server
app.listen(PORT, () => {
  console.log('express server running on port ' + PORT)
})
