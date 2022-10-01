// mfers treasury data & event parsing

// treasury contract etherscan:
// https://etherscan.io/address/0x21130e908bba2d41b63fbca7caa131285b8724f8#readProxyContract

import * as path from 'path'
import * as fs from 'fs'
import { ethers } from 'ethers'
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
  args: string[]
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

const cacheTreasuryEvents = async (
  provider: any,
  contract: any
): Promise<void> => {
  console.log('fetching events...\n\n')
  const currentBlock = await provider.getBlockNumber()
  const events = await contract.queryFilter(
    '*',
    TREASURY_CREATION_BLOCK,
    currentBlock
  )
  console.log('fetched ' + events.length + ' events!')

  console.log('saving to disk...')
  const cachePath = path.join(__dirname, 'cache')
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath)
  }
  fs.writeFileSync(path.join(cachePath, 'events.json'), JSON.stringify(events))
  console.log('events cached!\n\n')
}

const readEventCache = async (): Promise<Event[]> => {
  const cachePath = path.join(__dirname, 'cache', 'events.json')
  const fileData = fs.readFileSync(cachePath, { encoding: 'utf-8' })
  return JSON.parse(fileData)
}

// -- entry point --
const main = async () => {
  const { provider, contract } = initialize()

  // const { treasuryBal, signers } = await fetchTreasuryData(provider, contract)

  // console.log('caching events...')
  // await cacheTreasuryEvents(provider, contract)

  const events: Event[] = await readEventCache()
  const incomeTxs = events.filter(event => event.event === 'SafeReceived')

  const firstTxBlock = await provider.getBlock(incomeTxs[0].blockNumber)
  const latestTxBlock = await provider.getBlock(incomeTxs.pop().blockNumber)

  const firstTxDate = new Date(firstTxBlock.timestamp * 1000)
  const latestTxDate = new Date(latestTxBlock.timestamp * 1000)

  console.log({ firstTxDate, latestTxDate })

  // TODO: parse notable events

  // ExecutionSuccess
  // SignMsg
  // SafeReceived
  // AddedOwner
  // SafeSetup
}

main()
