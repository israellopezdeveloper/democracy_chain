import { ethers } from 'ethers'
import deployments from '../../../dapp/artifacts/contracts/DemocracyChain2.sol/DemocracyChain2.json'

export const democracyAbi = deployments.abi

export function getContract(
  address: string,
  providerOrSigner: ethers.Provider | ethers.Signer
) {
  return new ethers.Contract(address, democracyAbi, providerOrSigner)
}
