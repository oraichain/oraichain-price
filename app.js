import { setAiRequest } from './utils';

const runPriceFeed = async () => {
  const aiOracleAddr = process.env.AIORACLE_ADDR || "oscript_price_special";
  const validatorList = parseInt(process.env.VALIDATOR_LIST) || ["orai14vcw5qk0tdvknpa38wz46js5g7vrvut8lk0lk6"];
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
