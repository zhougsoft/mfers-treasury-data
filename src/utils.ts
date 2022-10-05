// blocks the thread with a no-op timeout wrapped in a promise
export const timeoutPromise = (duration: number) => {
  return new Promise<void>((resolve, reject) => {
    if (!duration) {
      reject('no duration passed')
    }
    setTimeout(() => {
      resolve()
    }, duration)
  })
}

// same as Promise.all(items), but waits for the first `batchSize` promises to finish before starting next batch
export const promiseAllInBatches = async (
  items: Array<any>,
  batchSize: number
) => {
  let position = 0
  let results = []
  while (position < items.length) {
    const itemsForBatch = items.slice(position, position + batchSize)
    results = [...results, ...(await Promise.all(itemsForBatch))]
    position += batchSize
    console.log({ position, resultsLength: results.length })
  }
  return results
}
