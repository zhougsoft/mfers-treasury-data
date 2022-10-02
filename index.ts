// mfers treasury data & event parsing

// treasury contract etherscan:
// https://etherscan.io/address/0x21130e908bba2d41b63fbca7caa131285b8724f8#readProxyContract

import 'isomorphic-unfetch'
import * as path from 'path'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
import { createClient } from '@urql/core'
import { ethers, BigNumber } from 'ethers'
import * as abi from './abi.json'

dotenv.config()

const { NODE_URL } = process.env
const TREASURY_ADDR = 'unofficialmfers.eth'
const TREASURY_CREATION_BLOCK = 14111591
const BLOCK_SUBGRAPH_ID = 'QmNtTKStPBm3bnghvyKLNY5B8etER8CG9ei9m7APT1kdx6'
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
  if (!NODE_URL || NODE_URL.length === 0)
    throw Error('NODE_URL not set in .env file')

  const provider = new ethers.providers.JsonRpcProvider(NODE_URL)
  const contract = new ethers.Contract(TREASURY_ADDR, abi, provider)
  const gqlClient = createClient({ url: BLOCK_SUBGRAPH_ENDPOINT })

  return { provider, contract, gqlClient }
}

// returns current treasury ETH balance and signers
const fetchTreasuryData = async (
  provider: any,
  contract: any
): Promise<{ treasuryBal: string; signers: string[] }> => {
  const treasuryBal = ethers.utils.formatEther(
    await provider.getBalance(TREASURY_ADDR)
  )
  const signers = await contract.getOwners()
  return { treasuryBal, signers }
}

// fetches all treasury `SafeRecieved` events and writes them to disk as JSON
const cacheIncomeEvents = async (
  provider: any,
  contract: any
): Promise<void> => {
  const currentBlock = await provider.getBlockNumber()
  const events = await contract.queryFilter(
    'SafeReceived',
    TREASURY_CREATION_BLOCK,
    currentBlock
  )

  const cachePath = path.join(__dirname, 'cache')
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath)
  }
  fs.writeFileSync(path.join(cachePath, 'events.json'), JSON.stringify(events))
}

// returns object parsed from cache JSON file
const readIncomeEventCache = async (): Promise<Event[]> => {
  const cachePath = path.join(__dirname, 'cache', 'events.json')
  const fileData = fs.readFileSync(cachePath, { encoding: 'utf-8' })
  return JSON.parse(fileData)
}

// -- entry point --
const main = async () => {
  const { provider, contract, gqlClient } = initialize()

  // const { treasuryBal, signers } = await fetchTreasuryData(provider, contract)
  // console.log("\n~*~ unofficial mfers treasury O-' ~*~\n")
  // console.log({ treasuryBal, signers })
  // console.log('caching events...')

  // if (!fs.existsSync(path.join(__dirname, 'cache'))) {
  //   await cacheIncomeEvents(provider, contract)
  // }

  const incomeTxs = []
  const incomeEvents: Event[] = await readIncomeEventCache()

  // TODO: this isnt working

  incomeEvents.forEach(async (ev: Event, i) => {
    console.log(`${((i / incomeEvents.length) * 100).toFixed(2)}% complete`)

    const { blockNumber } = ev

    const query = `{ blocks(where: { number: ${blockNumber} }) { timestamp } }`
    const result = await gqlClient.query(query).toPromise()

    incomeTxs.push({
      amount: ethers.utils.formatEther(ev.args[1]),
      from: ev?.args[0],
      timestamp: result?.data?.blocks[0]?.timestamp,
      blockNumber,
    })
  })

  fs.writeFileSync('output.json', JSON.stringify(incomeTxs))
  console.log('done')
} // end main

main()
