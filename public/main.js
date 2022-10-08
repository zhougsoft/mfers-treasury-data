// using chart.js to visualize data fetched from server
// https://www.chartjs.org/docs/latest

const RANGE_START = '2022-10-01'
const RANGE_END = '2022-10-05'

const _groupTxsByYear = txs =>
  txs.reduce((group, tx) => {
    const year = new Date(tx.x).getFullYear()
    group[year] = group[year] ?? []
    group[year].push(tx)
    return group
  }, {})

const _groupTxsByMonth = txs =>
  txs.reduce((group, tx) => {
    const month = new Date(tx.x).getMonth() + 1
    group[month] = group[month] ?? []
    group[month].push(tx)
    return group
  }, {})

const main = async () => {
  // fetch tx data from server
  const reqResult = await fetch('/api/txs')
    .then(res => res.json())
    .catch(error => {
      console.error(error)
      document.querySelector('main').innerHTML = '<h1>error fetching data</h1>'
    })

  // parse & validate date range input
  const rangeStartTime = new Date(RANGE_START + 'T00:00:00').getTime()
  const rangeEndTime = new Date(RANGE_END + 'T00:00:00').getTime()

  if (rangeStartTime > rangeEndTime) {
    throw Error('starting date range must be less than end date range')
  }

  // parse fetched data
  const txs = reqResult.txs
    .filter(tx => tx.amount > 0)
    .map(tx => {
      // add digits to the block timestamp to make parse-able by JS
      const timestamp = parseInt(`${tx.timestamp.toString()}000`)
      return {
        x: timestamp,
        y: tx.amount,
      }
    })

  const txsByYear = _groupTxsByYear(txs)

  const groupedTxs = {}
  for (var prop in txsByYear) {
    if (Object.prototype.hasOwnProperty.call(txsByYear, prop)) {
      const txsOfYear = txsByYear[prop]
      groupedTxs[prop] = _groupTxsByMonth(txsOfYear)
    }
  }

  // TODO: loop thru monthly txs and calc monthly income
  const txs2022 = groupedTxs[2022]
  console.log(txs2022)

  // setup chart dataset
  const chartData = {
    datasets: [
      {
        label: 'unofficial mfers ETH income',
        data: chartTxs,
        backgroundColor: ['#ffb470'],
        borderColor: ['#222'],
        borderWidth: 2,
      },
    ],
  }

  // setup chart config
  const chartConfig = {
    type: 'bar',
    data: chartData,
    options: {
      scales: {
        x: {
          parsing: false,
          type: 'time',
          time: {
            unit: 'hour',
          },
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  }

  // generate chart & render output
  new Chart(document.querySelector('#chart').getContext('2d'), chartConfig)
  document.querySelector(
    '#info'
  ).innerHTML = `${chartTxs.length} results for time range: ${RANGE_START} to ${RANGE_END}`
} // end main()

window.addEventListener('load', main)
