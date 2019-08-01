/**
 * Copyright (c) 2019-present, Project Democracy
 *
 * This source code is licensed under the Mozilla Public License, version 2,
 * found in the LICENSE file in the root directory of this source tree.
 */
const chai = require('chai');
const ethUtil = require('ethereumjs-util');
const VotingBooth = artifacts.require('./VotingBooth.sol');
const SimpleToken = artifacts.require('./mocks/SimpleToken');
const ERC1948 = artifacts.require('./mocks/ERC1948');

const should = chai
  .use(require('chai-as-promised'))
  .should();

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace.replace('0x', ''));
}


contract('Voting Booth', (accounts) => {
  const voter = accounts[1];
  const YES_BOX = accounts[2];
  const NO_BOX = accounts[3];
  const dataBefore = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const balanceCardId = 123;
  const voiceBudget = '400000000000000000000';
  const totalVotes = '400000000000000000000';
  let voiceCredits;
  let votes;
  let balanceCards;
  let originalByteCode;

  beforeEach(async () => {
    voiceCredits = await SimpleToken.new(voiceBudget);
    votes = await SimpleToken.new(totalVotes);
    balanceCards = await ERC1948.new();
    originalByteCode = VotingBooth._json.bytecode;
  });

  afterEach(() => {
    VotingBooth._json.bytecode = originalByteCode;
  });

  it('should allow to cast ballot', async () => {

    // deploy vote contract
    let tmp = VotingBooth._json.bytecode;
    // replace token address placeholder to real token address
    tmp = replaceAll(tmp, '1231111111111111111111111111111111111123', voiceCredits.address);
    tmp = replaceAll(tmp, '2341111111111111111111111111111111111234', votes.address);
    tmp = replaceAll(tmp, '3451111111111111111111111111111111111345', balanceCards.address);
    tmp = replaceAll(tmp, '4561111111111111111111111111111111111456', YES_BOX);
    tmp = replaceAll(tmp, '5671111111111111111111111111111111111567', NO_BOX);
    VotingBooth._json.bytecode = tmp;
    const voteContract = await VotingBooth.new();

    // fund voter
    await voiceCredits.transfer(voter, voiceBudget);
    await votes.transfer(voteContract.address, totalVotes);

    // print balance card for voter
    await balanceCards.mint(voter, balanceCardId);
    await balanceCards.approve(voteContract.address, balanceCardId, {from: voter});

    // voter signing transaction
    await voiceCredits.approve(voteContract.address, voiceBudget, {from: voter});

    // sending transaction
    const tx = await voteContract.castBallot(
      balanceCardId,
      [dataBefore],
      '3000000000000000000',
    ).should.be.fulfilled;

    // check result
    const credits = await voiceCredits.balanceOf(YES_BOX);
    assert.equal(credits.toString(10), '9000000000000000000');
    const voteAmount = await votes.balanceOf(YES_BOX);
    assert.equal(voteAmount.toString(10), '3000000000000000000');
    const card = await balanceCards.readData(balanceCardId);
    assert.equal(card, dataBefore);
  });


});
