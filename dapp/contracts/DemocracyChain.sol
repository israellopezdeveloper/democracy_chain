// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { StringsLib } from "./libs/StringsLib.sol";

error NotAdmin();
error NotRegistered();
error AlreadyVoted();
error NotValidCandidate();
error RegistrationClosed();
error VotingClosed();
error NotValidDates();
error CitizenAlreadyRegistered();
error CandidateAlreadyRegistered();

/**
 * @title DemocracyChain2
 * @author Israel
 * @notice This contract allows citizens to register and vote.
 */
contract DemocracyChain {
  using StringsLib for string;

  /// @notice The administrator address who deploys the contract.
  address private immutable _ADMIN;

  /// @notice The timestamp after which registration is closed.
  uint256 public immutable REGISTRATION_DEADLINE;
  /// @notice The timestamp after which voting is closed.
  uint256 public immutable VOTING_DEADLINE;

  struct Person {
    string dni;
    string name;
    address wallet;
  }

  struct Citizen {
    Person person;
    bool registered;
    bool voted;
  }

  struct Candidate {
    Citizen citizen;
    uint256 voteCount;
  }

  // Storage
  /// @notice Mapping from hashed DNI to citizen information.
  mapping(bytes32 => Citizen) public citizens; // hash_dni → citizen
  /// @notice Mapping from hashed DNI to candidate information.
  mapping(bytes32 => Candidate) public candidates; // hash_dni → candidate
  /// @notice Mapping from wallet address to hashed DNI.
  mapping(address => bytes32) public walletToDni; // wallet → dni hash

  /// @notice List of hashed DNIs for all candidates.
  bytes32[] public candidateList;

  /**
   * @notice Emitted when a citizen registers successfully.
   * @param wallet The wallet address of the registered citizen.
   * @param dni The DNI of the registered citizen.
   */
  event CitizenRegistered(address indexed wallet, string dni);
  /**
   * @notice Emitted when a candidate is added.
   * @param dni The DNI of the candidate.
   * @param name The name of the candidate.
   * @param wallet The wallet address of the candidate.
   */
  event CandidateAdded(string dni, string name, address indexed wallet);
  /**
   * @notice Emitted when a citizen votes for a candidate.
   * @param voter The wallet address of the voter.
   * @param candidateDni The DNI of the candidate who received the vote.
   */
  event Voted(address indexed voter, string candidateDni);

  /**
   * @notice Initializes the contract with registration and voting deadlines.
   * @param _registrationDeadline The timestamp when registration ends.
   * @param _votingDeadline The timestamp when voting ends.
   */
  constructor(uint256 _registrationDeadline, uint256 _votingDeadline) {
    if (_registrationDeadline > _votingDeadline) {
      revert NotValidDates();
    }
    REGISTRATION_DEADLINE = _registrationDeadline;
    VOTING_DEADLINE = _votingDeadline;
    if (block.timestamp > REGISTRATION_DEADLINE) {
      revert RegistrationClosed();
    }
    _ADMIN = msg.sender;
  }

  // modifier onlyAdmin() {
  //   if (msg.sender != ADMIN) {
  //     revert NotAdmin();
  //   }
  //   _;
  // }

  modifier onlyRegistered() {
    bytes32 dniHash = walletToDni[msg.sender];
    if (!citizens[dniHash].registered) {
      revert NotRegistered();
    }
    _;
  }

  modifier hasNotVoted() {
    bytes32 dniHash = walletToDni[msg.sender];
    if (citizens[dniHash].voted) {
      revert AlreadyVoted();
    }
    _;
  }

  modifier onlyValidCandidate(bytes32 _dniHash) {
    if (candidates[_dniHash].citizen.person.wallet == address(0)) {
      revert NotValidCandidate();
    }
    _;
  }

  modifier registrationOpen() {
    if (block.timestamp > REGISTRATION_DEADLINE) {
      revert RegistrationClosed();
    }
    _;
  }

  modifier votingOpen() {
    if (block.timestamp > VOTING_DEADLINE) {
      revert VotingClosed();
    }
    _;
  }

  /**
   * @notice Registers a new citizen in the system.
   * @param _dni The DNI of the citizen.
   * @param _name The name of the citizen.
   */
  function registerCitizen(
    string calldata _dni,
    string calldata _name
  ) external registrationOpen {
    bytes32 dniHash = _dni.toHash();

    if (citizens[dniHash].registered) {
      revert CitizenAlreadyRegistered();
    }

    citizens[dniHash] = Citizen({
      person: Person({ dni: _dni, name: _name, wallet: msg.sender }),
      registered: true,
      voted: false
    });

    walletToDni[msg.sender] = dniHash;

    emit CitizenRegistered(msg.sender, _dni);
  }

  /**
   * @notice Returns the information of the citizen associated with the caller's wallet.
   * @return The Citizen struct containing personal and registration info.
   */
  function getCitizen() external view returns (Citizen memory) {
    return citizens[walletToDni[msg.sender]];
  }

  /**
   * @notice Registers a new citizen and simultaneously adds them as a candidate.
   * @param _dni The DNI of the citizen.
   * @param _name The name of the citizen.
   */
  function addCitizenCandidate(
    string calldata _dni,
    string calldata _name
  ) external registrationOpen {
    bytes32 dniHash = _dni.toHash();

    if (citizens[dniHash].registered) {
      revert CitizenAlreadyRegistered();
    }

    citizens[dniHash] = Citizen({
      person: Person({ dni: _dni, name: _name, wallet: msg.sender }),
      registered: true,
      voted: false
    });

    walletToDni[msg.sender] = dniHash;

    emit CitizenRegistered(msg.sender, _dni);

    candidates[dniHash] = Candidate({
      citizen: citizens[dniHash],
      voteCount: 0
    });

    candidateList.push(dniHash);

    emit CandidateAdded(_dni, _name, msg.sender);
  }

  /**
   * @notice Converts the caller, if already registered, into a candidate.
   */
  function addCandidate() external onlyRegistered registrationOpen {
    bytes32 dniHash = walletToDni[msg.sender];

    if (candidates[dniHash].citizen.person.wallet != address(0)) {
      revert CandidateAlreadyRegistered();
    }
    Citizen memory citizen = citizens[dniHash];

    candidates[dniHash] = Candidate({ citizen: citizen, voteCount: 0 });

    candidateList.push(dniHash);

    emit CandidateAdded(citizen.person.dni, citizen.person.name, msg.sender);
  }

  /**
   * @notice Casts a vote for a candidate.
   * @param _dni The DNI of the candidate being voted for.
   */
  function vote(
    string calldata _dni
  )
    external
    onlyRegistered
    hasNotVoted
    votingOpen
    onlyValidCandidate(_dni.toHash())
  {
    bytes32 dniHash = _dni.toHash();

    ++candidates[dniHash].voteCount;

    bytes32 voterDni = walletToDni[msg.sender];
    citizens[voterDni].voted = true;

    emit Voted(msg.sender, _dni);
  }

  /**
   * @notice Retrieves information about a candidate given their DNI.
   * @param _dni The DNI of the candidate.
   * @return The Candidate struct containing the candidate's details and vote count.
   */
  function getCandidate(
    string calldata _dni
  ) external view returns (Candidate memory) {
    bytes32 dniHash = _dni.toHash();
    return candidates[dniHash];
  }

  /**
   * @notice Returns the total number of registered candidates.
   * @return The count of candidates.
   */
  function getCandidateCount() external view returns (uint256) {
    return candidateList.length;
  }

  /**
   * @notice Retrieves a candidate's information by their index in the candidate list.
   * @param index The index of the candidate in the candidate list array.
   * @return The Candidate struct for the candidate at the specified index.
   */
  function getCandidateByIndex(
    uint256 index
  ) external view returns (Candidate memory) {
    bytes32 dniHash = candidateList[index];
    return candidates[dniHash];
  }
}
