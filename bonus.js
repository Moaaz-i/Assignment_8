/**
 * Bonus (LeetCode 14): Longest Common Prefix
 * https://leetcode.com/problems/longest-common-prefix/
 *
 * Write a string to find the longest common prefix string amongst an array of strings.
 * If there is no common prefix, return an empty string "".
 */

/**
 * @param {string[]} strs
 * @return {string}
 */
var longestCommonPrefix = function (strs) {
  if (!strs || strs.length === 0) return '';

  // Scan character by character, using the first string as the reference.
  for (let i = 0; i < strs[0].length; i++) {
    const char = strs[0][i];
    for (let j = 1; j < strs.length; j++) {
      // Stop when the index is out of range or the characters do not match.
      if (i >= strs[j].length || strs[j][i] !== char) {
        return strs[0].slice(0, i);
      }
    }
  }

  return strs[0];
};

// Simple self test
const tests = [
  { input: ['flower', 'flow', 'flight'], expected: 'fl' },
  { input: ['dog', 'racecar', 'car'], expected: '' },
  { input: ['interspecies', 'interstellar', 'interstate'], expected: 'inters' },
  { input: ['single'], expected: 'single' },
  { input: [], expected: '' },
];

tests.forEach(({ input, expected }, i) => {
  const result = longestCommonPrefix(input);
  console.log(
    `Test ${i + 1}: ${JSON.stringify(input)} => "${result}" ${
      result === expected ? 'PASS' : `FAIL (expected "${expected}")`
    }`
  );
});

module.exports = longestCommonPrefix;
