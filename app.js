import Cosmos from '@oraichain/cosmosjs';
import { setAiRequest } from './utils';
import http from 'http';

const init = async () => {
  global.cosmos = new Cosmos(process.env.LCD_URL, process.env.CHAIN_ID);
  cosmos.setBech32MainPrefix('orai');

  const httpGet = url => {
    return new Promise((resolve, reject) => {
      http.get(url, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', reject);
    });
  };

  const validators = await httpGet(`${process.env.LCD_URL}/cosmos/staking/v1beta1/validators`);
  let validatorsActive = [];
  for (let val of JSON.parse(validators).validators) {
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
  const fixedValidVal = ['orai14vcw5qk0tdvknpa38wz46js5g7vrvut8lk0lk6', 'orai16e6cpk6ycddk6208fpaya7tmmardhvr77l5dtr', 'orai13ckyvg0ah9vuujtd49yner2ky92lej6n8ch2et', 'orai10dzr3yks2jrtgqjnpt6hdgf73mnset024k2lzy'];
  result = result.concat(fixedValidVal);
  result = [...new Set(result)];
  return result;
  // return ['orai14vcw5qk0tdvknpa38wz46js5g7vrvut8lk0lk6', 'orai16e6cpk6ycddk6208fpaya7tmmardhvr77l5dtr', 'orai13ckyvg0ah9vuujtd49yner2ky92lej6n8ch2et', 'orai10dzr3yks2jrtgqjnpt6hdgf73mnset024k2lzy', 'orai17zr98cwzfqdwh69r8v5nrktsalmgs5sawmngxz'];
}

const runPriceFeed = async () => {
  const validators = await init();
  const validatorList = randomValidators(validators, process.env.COUNT ? parseInt(process.env.COUNT) : 2);
  console.log(validatorList);
  const aiOracleAddr = process.env.AIORACLE_ADDR || "oscript_price_special";
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
