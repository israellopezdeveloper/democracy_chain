// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title StringsLib
 * @author Israel
 * @notice Library with string utility functions.
 */
library StringsLib {
  /**
   * @notice Computes the keccak256 hash of a given string.
   * @param str The input string to hash.
   * @return The keccak256 hash as bytes32.
   */
  function toHash(string memory str) internal pure returns (bytes32) {
    return keccak256(bytes(str));
  }
}
