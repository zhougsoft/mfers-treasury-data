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

const initialize = (): { provider: any; contract: any } => {
  if (!NODE_URL || NODE_URL.length === 0)
    throw Error('NODE_URL not set in .env file')
  if (!TREASURY_ADDR || TREASURY_ADDR.length === 0)
    throw Error('TREASURY_ADDR not set in .env file')

  const provider = new ethers.providers.JsonRpcProvider(NODE_URL)
  const contract = new ethers.Contract(TREASURY_ADDR, abi, provider)

  return { provider, contract }
}

const cacheEvents = async (provider: any, contract: any): Promise<void> => {
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

const readEventCache = async (): Promise<Array<any>> => {
  const cachePath = path.join(__dirname, 'cache', 'events.json')
  const fileData = fs.readFileSync(cachePath, { encoding: 'utf-8' })
  return JSON.parse(fileData)
}

// -- entry point --
const main = async () => {
  const { provider, contract } = initialize()

  console.log('fetching treasury data...\n\n')
  console.log(
    'treasury balance: ',
    ethers.utils.formatEther(await provider.getBalance(TREASURY_ADDR))
  )
  console.log('signer addresses: ', await contract.getOwners(), '\n\n')

  console.log('caching events...')
  await cacheEvents(provider, contract)
  const eventData = await readEventCache()
  console.log('events:', eventData)

  // TODO: parse notable events

  // ExecutionSuccess
  // SignMsg
  // SafeReceived
  // AddedOwner
  // SafeSetup
}

main()
