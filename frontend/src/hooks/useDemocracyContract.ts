import { usePublicClient, useWalletClient } from 'wagmi'
import { getContract } from 'viem'
import deployments from '../../../dapp/artifacts/contracts/DemocracyChain2.sol/DemocracyChain2.json'
import { CONTRACT_ADDRESS } from '../config'

export function useDemocracyContract() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const client = walletClient ?? publicClient

  if (!client) return null

  const contract = getContract({
    abi: deployments.abi,
    address: CONTRACT_ADDRESS,
    client,
  })

  return contract
}

export class Person {
  dni: string
  name: string
  wallet: string

  constructor(data: any) {
    if (Array.isArray(data)) {
      this.dni = data[0]
      this.name = data[1]
      this.wallet = data[2]
      return
    }
    if (typeof data === 'object') {
      this.dni = data.dni
      this.name = data.name
      this.wallet = data.wallet
      return
    }
    this.dni = ''
    this.name = ''
    this.wallet = ''
  }
}

export class Citizen {
  person: Person
  isRegistered: boolean
  voted: boolean

  constructor(data: any) {
    if (Array.isArray(data)) {
      this.person = new Person(data[0])
      this.person.dni = data[0].dni
      this.person.name = data[0].name
      this.person.wallet = data[0].wallet
      this.isRegistered = data[1]
      this.voted = data[2]
      return
    }
    if (typeof data === 'object') {
      this.person = new Person(data.person)
      this.isRegistered = data.isRegistered
      this.voted = data.voted
      return
    }
    console.log('Citizen - NULL')
    this.person = new Person(null)
    this.isRegistered = false
    this.voted = false
  }
}

export class Candidate {
  citizen: Citizen
  voteCount: bigint

  constructor(data: any) {
    if (Array.isArray(data)) {
      this.citizen = new Citizen(data[0])
      this.voteCount = data[1]
      return
    }
    if (typeof data === 'object') {
      this.citizen = new Citizen(data.citizen)
      this.voteCount = data.voteCount
      return
    }
    this.citizen = new Citizen(null)
    this.voteCount = BigInt(0)
  }
}
