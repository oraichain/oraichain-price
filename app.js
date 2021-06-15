import { setAiRequest } from './utils';

const runPriceFeed = async () => {
  const oracleScriptName = process.env.ORACLE_SCRIPT || "oscript_price_special";
  const count = parseInt(process.env.COUNT) || 1;
  try {
    await setAiRequest(oracleScriptName, count);
  } catch (error) {
    console.log("error: ", error)

  }
  setTimeout(runPriceFeed, parseInt(process.env.INTERVAL) || 120000);
}

const start = async () => {
  runPriceFeed();
};

start();
