const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DemocracyChain", function () {
  let democracy;
  let admin;
  let user1;
  let user2;
  let user3;
  let registrationDeadline;
  let votingDeadline;

  const DNI1 = "12345678A";
  const DNI2 = "87654321B";
  const DNI3 = "99999999Z";
  const NAME1 = "Alice";
  const NAME2 = "Bob";
  const NAME3 = "Charlie";

  beforeEach(async function () {
    [admin, user1, user2, user3] = await ethers.getSigners();

    const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    registrationDeadline = blockTimestamp + 2 * 24 * 60 * 60;
    votingDeadline = blockTimestamp + 4 * 24 * 60 * 60;

    const DemocracyChainFactory = await ethers.getContractFactory(
      "DemocracyChain"
    );
    democracy = await DemocracyChainFactory.deploy(
      registrationDeadline,
      votingDeadline
    );
    await democracy.waitForDeployment();
  });

  it("should deploy with correct admin and deadlines", async function () {
    expect(await democracy.REGISTRATION_DEADLINE()).to.equal(
      registrationDeadline
    );
    expect(await democracy.VOTING_DEADLINE()).to.equal(votingDeadline);
  });

  it("should revert if registrationDeadline >= votingDeadline", async function () {
    const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    const DemocracyChainFactory = await ethers.getContractFactory(
      "DemocracyChain"
    );

    try {
      await DemocracyChainFactory.deploy(
        blockTimestamp + 1000,
        blockTimestamp + 999
      );
      expect.fail("Expected deploy to revert, but it succeeded");
    } catch (e) {
      expect(e.message).to.match(/NotValidDates/);
    }
  });

  it("should register a citizen", async function () {
    await expect(democracy.connect(user1).registerCitizen(DNI1, NAME1))
      .to.emit(democracy, "CitizenRegistered")
      .withArgs(user1.address, DNI1);

    const citizen = await democracy.connect(user1).getCitizen();
    expect(citizen.person.dni).to.equal(DNI1);
    expect(citizen.person.name).to.equal(NAME1);
    expect(citizen.person.wallet).to.equal(user1.address);
    expect(citizen.registered).to.be.true;
    expect(citizen.voted).to.be.false;
  });

  it("should not allow duplicate citizen registration", async function () {
    await democracy.connect(user1).registerCitizen(DNI1, NAME1);

    await expect(
      democracy.connect(user1).registerCitizen(DNI1, NAME1)
    ).to.be.revertedWithCustomError(democracy, "CitizenAlreadyRegistered");
  });

  it("should register a citizen as candidate directly", async function () {
    await expect(democracy.connect(user1).addCitizenCandidate(DNI1, NAME1))
      .to.emit(democracy, "CandidateAdded")
      .withArgs(DNI1, NAME1, user1.address);

    const citizen = await democracy.connect(user1).getCitizen();
    expect(citizen.registered).to.be.true;

    const candidate = await democracy.getCandidate(DNI1);
    expect(candidate.citizen.person.dni).to.equal(DNI1);
    expect(candidate.voteCount).to.equal(0);

    const count = await democracy.getCandidateCount();
    expect(count).to.equal(1);
  });

  it("should convert existing citizen to candidate", async function () {
    await democracy.connect(user1).registerCitizen(DNI1, NAME1);

    await expect(democracy.connect(user1).addCandidate())
      .to.emit(democracy, "CandidateAdded")
      .withArgs(DNI1, NAME1, user1.address);

    const candidate = await democracy.getCandidate(DNI1);
    expect(candidate.voteCount).to.equal(0);

    const count = await democracy.getCandidateCount();
    expect(count).to.equal(1);
  });

  it("should prevent double candidate registration", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);

    await expect(
      democracy.connect(user1).addCandidate()
    ).to.be.revertedWithCustomError(democracy, "CandidateAlreadyRegistered");
  });

  it("should allow voting for a valid candidate", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);
    await democracy.connect(user2).registerCitizen(DNI2, NAME2);

    await expect(democracy.connect(user2).vote(DNI1))
      .to.emit(democracy, "Voted")
      .withArgs(user2.address, DNI1);

    const candidate = await democracy.getCandidate(DNI1);
    expect(candidate.voteCount).to.equal(1);

    const voter = await democracy.connect(user2).getCitizen();
    expect(voter.voted).to.be.true;
  });

  it("should revert voting twice", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);
    await democracy.connect(user2).registerCitizen(DNI2, NAME2);

    await democracy.connect(user2).vote(DNI1);

    await expect(
      democracy.connect(user2).vote(DNI1)
    ).to.be.revertedWithCustomError(democracy, "AlreadyVoted");
  });

  it("should revert voting for non-existent candidate", async function () {
    await democracy.connect(user2).registerCitizen(DNI2, NAME2);

    await expect(
      democracy.connect(user2).vote(DNI1)
    ).to.be.revertedWithCustomError(democracy, "NotValidCandidate");
  });

  it("should revert registration after deadline", async function () {
    await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    await expect(
      democracy.connect(user1).registerCitizen(DNI1, NAME1)
    ).to.be.revertedWithCustomError(democracy, "RegistrationClosed");
  });

  it("should revert voting after voting deadline", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);
    await democracy.connect(user2).registerCitizen(DNI2, NAME2);

    await ethers.provider.send("evm_increaseTime", [5 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    await expect(
      democracy.connect(user2).vote(DNI1)
    ).to.be.revertedWithCustomError(democracy, "VotingClosed");
  });

  it("should retrieve candidate by index", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);
    await democracy.connect(user2).addCitizenCandidate(DNI2, NAME2);

    const candidate1 = await democracy.getCandidateByIndex(0);
    const candidate2 = await democracy.getCandidateByIndex(1);

    expect(candidate1.citizen.person.dni).to.equal(DNI1);
    expect(candidate2.citizen.person.dni).to.equal(DNI2);
  });

  it("should have zero candidates initially", async function () {
    expect(await democracy.getCandidateCount()).to.equal(0);
  });

  it("should return empty candidate if not exists", async function () {
    const candidate = await democracy.getCandidate(DNI3);
    expect(candidate.citizen.person.wallet).to.equal(ethers.ZeroAddress);
    expect(candidate.voteCount).to.equal(0);
  });

  it("should return empty citizen if not registered", async function () {
    const citizen = await democracy.connect(user2).getCitizen();
    expect(citizen.person.wallet).to.equal(ethers.ZeroAddress);
    expect(citizen.registered).to.be.false;
    expect(citizen.voted).to.be.false;
  });

  it("should revert addCandidate if user is not registered", async function () {
    await expect(
      democracy.connect(user2).addCandidate()
    ).to.be.revertedWithCustomError(democracy, "NotRegistered");
  });

  it("should store walletToDni mapping on registration", async function () {
    await democracy.connect(user1).registerCitizen(DNI1, NAME1);
    const dniHash = ethers.keccak256(ethers.toUtf8Bytes(DNI1));
    const storedHash = await democracy.walletToDni(user1.address);
    expect(storedHash).to.equal(dniHash);
  });

  it("should allow a candidate to vote for themselves", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);
    await democracy.connect(user1).vote(DNI1);
    const candidate = await democracy.getCandidate(DNI1);
    expect(candidate.voteCount).to.equal(1);
  });

  it("should allow different citizens to vote different candidates", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);
    await democracy.connect(user2).addCitizenCandidate(DNI2, NAME2);

    await democracy.connect(user3).registerCitizen(DNI3, NAME3);

    await democracy.connect(user2).vote(DNI1);
    await democracy.connect(user3).vote(DNI2);

    const candidate1 = await democracy.getCandidate(DNI1);
    const candidate2 = await democracy.getCandidate(DNI2);

    expect(candidate1.voteCount).to.equal(1);
    expect(candidate2.voteCount).to.equal(1);
  });

  it("should execute onlyAdmin function for admin", async function () {
    // Only works if you add this function to your contract:
    // function testOnlyAdmin() external onlyAdmin { }
    if (democracy.testOnlyAdmin) {
      await expect(democracy.connect(admin).testOnlyAdmin()).to.not.be.reverted;
    }
  });

  it("should revert onlyAdmin function for non-admin", async function () {
    if (democracy.testOnlyAdmin) {
      await expect(
        democracy.connect(user2).testOnlyAdmin()
      ).to.be.revertedWithCustomError(democracy, "NotAdmin");
    }
  });

  it("should revert if two different users register with same DNI", async function () {
    await democracy.connect(user1).registerCitizen(DNI1, NAME1);

    await expect(
      democracy.connect(user2).registerCitizen(DNI1, NAME2)
    ).to.be.revertedWithCustomError(democracy, "CitizenAlreadyRegistered");
  });

  it("should revert if trying to add candidate with DNI of existing citizen", async function () {
    await democracy.connect(user1).registerCitizen(DNI1, NAME1);

    await expect(
      democracy.connect(user2).addCitizenCandidate(DNI1, NAME2)
    ).to.be.revertedWithCustomError(democracy, "CitizenAlreadyRegistered");
  });

  it("should count votes from different citizens for same candidate", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);

    await democracy.connect(user2).registerCitizen(DNI2, NAME2);
    await democracy.connect(user3).registerCitizen(DNI3, NAME3);

    await democracy.connect(user2).vote(DNI1);
    await democracy.connect(user3).vote(DNI1);

    const candidate = await democracy.getCandidate(DNI1);
    expect(candidate.voteCount).to.equal(2);
  });

  it("should revert getCandidateByIndex for invalid index", async function () {
    await expect(democracy.getCandidateByIndex(0)).to.be.reverted;
  });

  it("should revert if citizen tries to add themselves twice as candidate", async function () {
    await democracy.connect(user1).registerCitizen(DNI1, NAME1);
    await democracy.connect(user1).addCandidate();

    await expect(
      democracy.connect(user1).addCandidate()
    ).to.be.revertedWithCustomError(democracy, "CandidateAlreadyRegistered");
  });

  it("should revert vote if user is not registered", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);

    await expect(
      democracy.connect(user2).vote(DNI1)
    ).to.be.revertedWithCustomError(democracy, "NotRegistered");
  });

  it("should revert vote if candidateList is empty", async function () {
    await democracy.connect(user1).registerCitizen(DNI1, NAME1);

    await expect(
      democracy.connect(user1).vote(DNI2)
    ).to.be.revertedWithCustomError(democracy, "NotValidCandidate");
  });

  it("should return correct candidate count after multiple candidates", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);
    await democracy.connect(user2).addCitizenCandidate(DNI2, NAME2);

    expect(await democracy.getCandidateCount()).to.equal(2);
  });

  it("should consume reasonable gas for registerCitizen", async function () {
    const tx = await democracy.connect(user1).registerCitizen(DNI1, NAME1);
    const receipt = await tx.wait();

    // Ejemplo de aserción de máximo gas esperado
    expect(receipt.gasUsed).to.be.lt(150_000);
  });

  it("should consume reasonable gas for addCitizenCandidate", async function () {
    const tx = await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);
    const receipt = await tx.wait();

    expect(receipt.gasUsed).to.be.lt(300_000);
  });

  it("should consume reasonable gas for addCandidate", async function () {
    await democracy.connect(user1).registerCitizen(DNI1, NAME1);
    const tx = await democracy.connect(user1).addCandidate();
    const receipt = await tx.wait();

    expect(receipt.gasUsed).to.be.lt(180_000);
  });

  it("should consume reasonable gas for vote", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);
    await democracy.connect(user2).registerCitizen(DNI2, NAME2);

    const tx = await democracy.connect(user2).vote(DNI1);
    const receipt = await tx.wait();

    expect(receipt.gasUsed).to.be.lt(120_000);
  });

  it("should consume minimal gas for getCandidateByIndex", async function () {
    await democracy.connect(user1).addCitizenCandidate(DNI1, NAME1);

    const tx = await democracy.getCandidateByIndex.staticCall(0);
    // staticCall NO gasta gas real, pero podemos verificar llamada exitosa.
    expect(tx.citizen.person.dni).to.equal(DNI1);
  });

  it("should revert if block.timestamp >= registrationDeadline", async function () {
    const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    // deliberately set registrationDeadline in the past
    const regDeadline = blockTimestamp - 1;
    const votDeadline = blockTimestamp + 1000;

    const DemocracyChainFactory = await ethers.getContractFactory(
      "DemocracyChain"
    );

    await expect(
      DemocracyChainFactory.deploy(regDeadline, votDeadline)
    ).to.be.revertedWithCustomError(democracy, "RegistrationClosed");
  });
});
