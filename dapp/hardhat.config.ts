import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-verify'
// @ts-ignore
import 'solidity-coverage'
import 'hardhat-gas-reporter'
import * as dotenv from 'dotenv'

dotenv.config()

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ''
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
const INFURA_API_KEY = process.env.INFURA_API_KEY || ''
const showPrices = process.env.SHOW_PRICES === 'true'

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {},
    localhost: {
      url: 'http://127.0.0.1:8545/',
      chainId: 31337,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  solidity: '0.8.28',
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
  gasReporter: {
    enabled: true,
    currency: 'EUR',
    coinmarketcap: showPrices ? COINMARKETCAP_API_KEY : undefined,
    token: 'ETH',
    gasPrice: 50,
  },
}

export default config
