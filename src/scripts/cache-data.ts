import 'isomorphic-unfetch'
import * as path from 'path'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
import { createClient } from '@urql/core'
import { ethers, BigNumber } from 'ethers'
import * as abi from '../data/abi.json'

dotenv.config()

const { NODE_URL } = process.env
const TREASURY_ADDR = 'unofficialmfers.eth'
const TREASURY_CREATION_BLOCK = 14111591
const BLOCK_SUBGRAPH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks'

interface Event {
  blockNumber: number
  blockHash: string
  transactionIndex: number
  removed: boolean
  address: string
  data: string
  topics: string[]
  transactionHash: string
  logIndex: number
  event: string // event identifier; ex: 'SafeReceived'
  eventSignature: string
  args: string[] | BigNumber[]
}

// sets up library clients
const initialize = (): { provider: any; contract: any; gqlClient: any } => {
  try {
    if (!NODE_URL || NODE_URL.length === 0)
      throw Error('NODE_URL not set in .env file')

    const provider = new ethers.providers.JsonRpcProvider(NODE_URL)
    const contract = new ethers.Contract(TREASURY_ADDR, abi, provider)
    const gqlClient = createClient({ url: BLOCK_SUBGRAPH_ENDPOINT })

    return { provider, contract, gqlClient }
  } catch (error) {
    console.error(error)
  }
}

// returns current treasury ETH balance and signers
const fetchTreasuryData = async (
  provider: any,
  contract: any
): Promise<{ treasuryBal: string; signers: string[] }> => {
  try {
    const treasuryBal = ethers.utils.formatEther(
      await provider.getBalance(TREASURY_ADDR)
    )
    const signers = await contract.getOwners()
    return { treasuryBal, signers }
  } catch (error) {
    console.error(error)
  }
}

// fetches all treasury `SafeRecieved` events and writes them to disk as JSON
const cacheIncomeEvents = async (
  provider: any,
  contract: any
): Promise<void> => {
  try {
    const currentBlock = await provider.getBlockNumber()
    const events = await contract.queryFilter(
      'SafeReceived',
      TREASURY_CREATION_BLOCK,
      currentBlock
    )

    const cachePath = path.join(__dirname, '../../cache')
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath)
    }
    fs.writeFileSync(
      path.join(cachePath, 'events.json'),
      JSON.stringify(events)
    )
  } catch (error) {
    console.error(error)
  }
}

// returns object parsed from cache JSON file
const readIncomeEventCache = async (): Promise<Event[]> => {
  try {
    const cachePath = path.join(__dirname, '../../cache', 'events.json')
    const fileData = fs.readFileSync(cachePath, { encoding: 'utf-8' })
    return JSON.parse(fileData)
  } catch (error) {
    console.error(error)
  }
}

// returns UNIX timestamp of a passed block number, fetched from subgraph
const fetchBlockTimestamp = async (
  blockNumber: number,
  gqlClient: any
): Promise<number> => {
  try {
    const query = `{ blocks(where: { number: ${blockNumber} }) { timestamp } }`
    const result = await gqlClient.query(query).toPromise().catch(console.error)
    return parseInt(result?.data?.blocks[0]?.timestamp)
  } catch (error) {
    console.error(error)
  }
}

// writes passed data to the `output/output.json` file
const writeOutputJSON = async (data: any, filename: string) => {
  try {
    const outputPath = path.join(__dirname, '../../output')
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath)
    }
    fs.writeFileSync(
      path.join(outputPath, `${filename}.json`),
      JSON.stringify(data)
    )
  } catch (error) {
    console.error(error)
  }
}

// -- entry point --
const main = async () => {
  const { provider, contract, gqlClient } = initialize()

  // if no event cache exists, fetch & cache events
  if (!fs.existsSync(path.join(__dirname, '../../cache'))) {
    console.log('caching events...')
    await cacheIncomeEvents(provider, contract)
  }

  // read events from the event cache
  const incomeEvents: Event[] = await readIncomeEventCache()

  // fetch timestamp for each event by block number via subgraph
  const incomeTxPromises = incomeEvents.map(async ev => {
    const timestamp = await fetchBlockTimestamp(ev.blockNumber, gqlClient)

    const incomeTx = {
      amount: parseFloat(ethers.utils.formatEther(ev.args[1])),
      from: ev?.args[0],
      timestamp,
      blockNumber: ev.blockNumber,
    }

    return incomeTx
  })

  // wait for graph queries to resolve then write resulting data to disk as JSON
  console.log(`\nfetching timestamps for events...`)

  // TODO: break these into batches of 250 and fetch in a loop with a timeout instead of all at once!
  // requests will fail on batches of over 500
  const incomeTxs = await Promise.all(incomeTxPromises)

  await writeOutputJSON(incomeTxs, 'output')
  console.log(`done! wrote ${incomeTxs.length} txs to output\n`)
} // end main

main()
