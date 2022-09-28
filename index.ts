import { ethers } from 'ethers'
import * as dotenv from 'dotenv'
import * as abi from './abi.json'

const main = async () => {
  dotenv.config()
  const { NODE_URL, TREASURY_ADDR } = process.env

  if (!NODE_URL || NODE_URL.length === 0)
    throw Error('NODE_URL not set in .env file')
  if (!TREASURY_ADDR || TREASURY_ADDR.length === 0)
    throw Error('TREASURY_ADDR not set in .env file')

  const provider = new ethers.providers.JsonRpcProvider(NODE_URL)
  const contract = new ethers.Contract(TREASURY_ADDR, abi, provider)

  console.log('signers: ', await contract.getOwners())

  // treasury contract etherscan:
  // https://etherscan.io/address/0x21130e908bba2d41b63fbca7caa131285b8724f8#readProxyContract

  // notable events:
  // ExecutionSuccess
  // SignMsg
  // SafeReceived
  // AddedOwner
  // SafeSetup

  // TODO: parse events
  // contract.queryFilter()
}

main()
