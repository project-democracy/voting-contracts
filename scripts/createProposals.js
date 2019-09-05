const fs = require('fs');
const VotingBooth = require('../build/spendies/VotingBooth');
const BallotBox = require('../build/spendies/BallotBox');
var oldData = require('../oldData.json');

const CONFIG = {
  fileName: {
    booth: "boothAddrs.txt",
    yes: "yesAddrs.txt",
    no: "noAddrs.txt",
    oldData: 'old.json',
    json: "proposals.json"
  },
  howMany: 96
}

function generateProposal(motionId) {
  const motionId48 = ('00000000000' + motionId.toString(16)).substr(-12);
  const yesBox = BallotBox.withParams({
    IS_YES: '000000000001',
    MOTION_ID: motionId48
  });
  const noBox = BallotBox.withParams({
    IS_YES: '000000000000',
    MOTION_ID: motionId48
  });

  return {
    booth: VotingBooth.withParams({ 
      YES_BOX: yesBox.address, 
      NO_BOX: noBox.address,
      PROPOSAL_ID: motionId48
    }),
    yes: yesBox,
    no: noBox
  }
}

async function main() {
  const propJson = [];
  for (let i = 0; i < CONFIG.howMany; i++) {
    const proposal = generateProposal(i);
    fs.appendFileSync(CONFIG.fileName.booth, proposal.booth.address+"\n");
    fs.appendFileSync(CONFIG.fileName.yes, proposal.yes.address+"\n");
    fs.appendFileSync(CONFIG.fileName.no, proposal.no.address+"\n");
    const elem = {
      title: "",
      topic:[],
      proposalId: "",
      description: "",
      boothAddress: proposal.booth.address,
      noBoxAddress: proposal.no.address,
      yesBoxAddress: proposal.yes.address
    };
    if (oldData && oldData.proposals && oldData.proposals[i] && oldData.proposals[i].proposalId) {
      elem.title = oldData.proposals[i].title;
      elem.topics = oldData.proposals[i].topics;
      elem.proposalId = oldData.proposals[i].proposalId;
      elem.description = oldData.proposals[i].description;
    }
    propJson.push(elem);
  }
  const json = {
    proposals: propJson,
    voteEndTime: "",
    voteStartTime: ""
  }
  fs.writeFileSync(CONFIG.fileName.json, JSON.stringify(json, null, 2));
}

main();