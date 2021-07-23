import Cosmos from '@oraichain/cosmosjs';
import { setAiRequest } from './utils';
import https from 'https';

const init = async () => {
  global.cosmos = new Cosmos(process.env.LCD_URL, process.env.CHAIN_ID);
  cosmos.setBech32MainPrefix('orai');

  const httpGet = url => {
    return new Promise((resolve, reject) => {
      https.get(url, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', reject);
    });
  };

  const validators = await httpGet('https://lcd.orai.io/cosmos/staking/v1beta1/validators');
  const validatorList = JSON.parse(validators).validators.map(val => cosmos.getAddressStr(val.operator_address));
  return validatorList;
}

const randomValidators = (validatorList) => {
  return ["orai14vcw5qk0tdvknpa38wz46js5g7vrvut8lk0lk6"]
}

const runPriceFeed = async () => {
  const validators = await init();
  const validatorList = randomValidators(validators);
  const aiOracleAddr = process.env.AIORACLE_ADDR || "oscript_price_special";
  try {
    await setAiRequest(aiOracleAddr, validatorList);
  } catch (error) {
    console.log("error: ", error)

  }
  setTimeout(runPriceFeed, parseInt(process.env.INTERVAL) || 120000);
}

const start = async () => {
  runPriceFeed();
};

start();
