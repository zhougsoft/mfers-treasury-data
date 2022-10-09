// using chart.js to visualize data fetched from server
// https://www.chartjs.org/docs/latest

const CHART_LABEL = 'unofficial mfers treasury monthly ETH income'
const CHART_YEAR = 2022
const MONTH_KEY = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]

// groups flat list of txs by year as properties in object
const groupTxsByYear = txs =>
  txs.reduce((group, tx) => {
    const year = new Date(tx.x).getFullYear()
    group[year] = group[year] ?? []
    group[year].push(tx)
    return group
  }, {})

// groups flat list of txs by month as properties in object
const groupTxsByMonth = txs =>
  txs.reduce((group, tx) => {
    const month = new Date(tx.x).getMonth() + 1
    group[month] = group[month] ?? []
    group[month].push(tx)
    return group
  }, {})

// --- entry point ---
const main = async () => {
  // fetch tx data from server
  const reqResult = await fetch('/api/txs')
    .then(res => res.json())
    .catch(error => {
      console.error(error)
      document.querySelector('main').innerHTML = '<h1>error fetching data</h1>'
    })

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

  // parse the flat timestamp list into date heirarchy object:
  // { year: { month: { x, y } }}
  const groupedTxs = {}
  const txsByYear = groupTxsByYear(txs)
  for (const prop in txsByYear) {
    if (Object.prototype.hasOwnProperty.call(txsByYear, prop)) {
      const txsOfYear = txsByYear[prop]
      groupedTxs[prop] = groupTxsByMonth(txsOfYear)
    }
  }

  // calculate total income of each month of given `CHART_YEAR`
  const monthlyTotals = []
  const txsByMonth = groupedTxs[CHART_YEAR]
  for (const prop in txsByMonth) {
    if (Object.prototype.hasOwnProperty.call(txsByMonth, prop)) {
      const txsOfMonth = txsByMonth[prop]
      const monthlyTotal = txsOfMonth.reduce(
        (prev, curr) => {
          // x = label, y = accumulative ETH total
          return {
            x: `${MONTH_KEY[prop - 1]} '${CHART_YEAR.toString().substring(2)}`,
            y: prev.y + curr.y,
          }
        },
        { y: 0 }
      )
      monthlyTotals.push(monthlyTotal)
    }
  }

  // setup chart dataset
  const chartData = {
    labels: monthlyTotals.map(total => total.x),
    datasets: [
      {
        label: CHART_LABEL,
        data: monthlyTotals,
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
        // // use below x scale with date-fns adapter
        // x: {
        //   parsing: false,
        //   type: 'time',
        //   time: {
        //     unit: 'month',
        //   },
        // },
        y: {
          beginAtZero: true,
        },
      },
    },
  }

  // generate chart & render output
  new Chart(document.querySelector('#chart').getContext('2d'), chartConfig)
} // end main()

window.addEventListener('load', main)
