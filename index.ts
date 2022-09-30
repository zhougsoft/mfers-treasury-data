// mfers treasury data & event parsing

// treasury contract etherscan:
// https://etherscan.io/address/0x21130e908bba2d41b63fbca7caa131285b8724f8#readProxyContract

import * as path from 'path'
import * as fs from 'fs'
import { ethers } from 'ethers'
import * as dotenv from 'dotenv'
import * as abi from './abi.json'

dotenv.config()
const { NODE_URL, TREASURY_ADDR } = process.env

const initialize = () => {
  if (!NODE_URL || NODE_URL.length === 0)
    throw Error('NODE_URL not set in .env file')
  if (!TREASURY_ADDR || TREASURY_ADDR.length === 0)
    throw Error('TREASURY_ADDR not set in .env file')

  const provider = new ethers.providers.JsonRpcProvider(NODE_URL)
  const contract = new ethers.Contract(TREASURY_ADDR, abi, provider)

  return { provider, contract }
}

const cacheEvents = async (provider, contract) => {
  console.log('fetching events...\n\n')
  const currentBlock = await provider.getBlockNumber()
  const events = await contract.queryFilter('*', 0, currentBlock)
  console.log('fetched ' + events.length + ' events!')

  console.log('saving to disk...')
  const cachePath = path.join(__dirname, 'cache')
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath)
  }
  fs.writeFileSync(path.join(cachePath, 'events.json'), JSON.stringify(events))
  console.log('events cached!\n\n')
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

  await cacheEvents(provider, contract)

  // TODO: open & read events cache

  // TODO: parse notable events

  // ExecutionSuccess
  // SignMsg
  // SafeReceived
  // AddedOwner
  // SafeSetup
}

main()
