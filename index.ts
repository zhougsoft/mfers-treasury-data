// mfers treasury data & event parsing

// treasury contract etherscan:
// https://etherscan.io/address/0x21130e908bba2d41b63fbca7caa131285b8724f8#readProxyContract

import * as path from 'path'
import * as fs from 'fs'
import { ethers, BigNumber } from 'ethers'
import * as dotenv from 'dotenv'
import * as abi from './abi.json'

dotenv.config()

const { NODE_URL } = process.env
const TREASURY_ADDR = 'unofficialmfers.eth'
const TREASURY_CREATION_BLOCK = 14111591

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

const initialize = (): { provider: any; contract: any } => {
  if (!NODE_URL || NODE_URL.length === 0)
    throw Error('NODE_URL not set in .env file')
  if (!TREASURY_ADDR || TREASURY_ADDR.length === 0)
    throw Error('TREASURY_ADDR not set in .env file')

  const provider = new ethers.providers.JsonRpcProvider(NODE_URL)
  const contract = new ethers.Contract(TREASURY_ADDR, abi, provider)

  return { provider, contract }
}

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

const readEventCache = async (): Promise<Event[]> => {
  const cachePath = path.join(__dirname, 'cache', 'events.json')
  const fileData = fs.readFileSync(cachePath, { encoding: 'utf-8' })
  return JSON.parse(fileData)
}

// -- entry point --
const main = async () => {
  const { provider, contract } = initialize()
  const { treasuryBal, signers } = await fetchTreasuryData(provider, contract)

  console.log("\n~*~ unofficial mfers treasury O-' ~*~\n")
  console.log({ treasuryBal, signers })

  // notable events:

  // ExecutionSuccess
  // SignMsg
  // SafeReceived
  // AddedOwner
  // SafeSetup

  console.log('caching events...')
  await cacheIncomeEvents(provider, contract)

  const incomeEvents: Event[] = await readEventCache()

  // TODO: loop through each income event and fetch block date
  // this will require a shit load of calls to the chain
  // it will be too much for infura, must run own node for this!

  // example of parsing an event to get the relevant data
  const firstTx = incomeEvents[0]
  const firstTxBlock = await provider.getBlock(firstTx.blockNumber)
  const tx = {
    amount: ethers.utils.formatEther(firstTx.args[1]),
    from: firstTx.args[0],
    date: new Date(firstTxBlock.timestamp * 1000).toLocaleDateString('en-US'),
  }
  console.log('parsed income event:', tx)
} // end main

main()
