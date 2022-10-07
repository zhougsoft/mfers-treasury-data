const main = async () => {
  // fetch the local JSON data
  const incomeTxs = await fetch('/api/txs').then(res => res.json())

  // TODO: chart `incomeTxs` data with chart.js
  // https://www.chartjs.org/docs/latest
  console.log({ incomeTxs })

  const canvas = document.querySelector('#chart')
  const chartOpts = {
    type: 'bar',
    data: {
      labels: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      datasets: [
        {
          label: 'total monthly ETH income',
          data: [12, 19, 3, 5, 2, 3, 13, 7, 0, 3, 16, 5],
          backgroundColor: 'coral',
        },
      ],
    },
  }

  new Chart(canvas, chartOpts)
}
window.addEventListener('load', main)
