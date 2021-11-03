const Cosmos = require('@oraichain/cosmosjs').default;
const { setAiRequest } = require('./utils');
const http = require('http');

const init = async () => {
  global.cosmos = new Cosmos(process.env.LCD_URL, process.env.CHAIN_ID);
  cosmos.setBech32MainPrefix('orai');

  const validators = await cosmos.get(`/cosmos/staking/v1beta1/validators`);
  let validatorsActive = [];
  for (let val of validators.validators) {
    if (!val.jailed && val.status === "BOND_STATUS_BONDED") validatorsActive.push(cosmos.getAddressStr(val.operator_address))
  }
  return validatorsActive;
}

const randomValidators = (validatorList, n) => {
  let result = new Array(n),
    len = validatorList.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    const x = Math.floor(Math.random() * len);
    result[n] = validatorList[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  const fixedValidVal = ['orai14vcw5qk0tdvknpa38wz46js5g7vrvut8lk0lk6', 'orai16e6cpk6ycddk6208fpaya7tmmardhvr77l5dtr', 'orai13ckyvg0ah9vuujtd49yner2ky92lej6n8ch2et'];
  result = result.concat(fixedValidVal);
  result = [...new Set(result)];
  return result;
  // return ['orai14vcw5qk0tdvknpa38wz46js5g7vrvut8lk0lk6', 'orai16e6cpk6ycddk6208fpaya7tmmardhvr77l5dtr', 'orai13ckyvg0ah9vuujtd49yner2ky92lej6n8ch2et', 'orai10dzr3yks2jrtgqjnpt6hdgf73mnset024k2lzy', 'orai17zr98cwzfqdwh69r8v5nrktsalmgs5sawmngxz'];
}

const runPriceFeed = async () => {
  console.log('\x1b[36m%s\x1b[0m', "\nOraichain Pricefeed runner, v0.1\n")
  const validators = await init();
  const validatorList = randomValidators(validators, process.env.COUNT ? parseInt(process.env.COUNT) : 2);
  console.log(validatorList);
  const aiOracleAddr = process.env.AIORACLE_ADDR;
  await setAiRequest(aiOracleAddr, validatorList);
}

const start = async () => {
  try {
    runPriceFeed();
  } catch (error) {
    setTimeout(start, parseInt(process.env.INTERVAL) || 120000);
  }
  setTimeout(start, parseInt(process.env.INTERVAL) || 120000);
};

start();
