import { buildModule } from '@nomicfoundation/ignition-core'

const registrationDeadline = parseInt(process.env.REGISTRATION_DEADLINE)
const votingDeadline = parseInt(process.env.VOTING_DEADLINE)

if (!registrationDeadline || !votingDeadline) {
  throw new Error(
    '❌ REGISTRATION_DEADLINE or VOTING_DEADLINE not set in env vars.'
  )
}

export default buildModule('DemocracyChain2Module', (m) => {
  const democracy = m.contract('DemocracyChain', [
    registrationDeadline,
    votingDeadline,
  ])

  // TODO: hay que integrar el ensure is deployed
  return { democracy }
})
