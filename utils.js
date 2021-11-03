const Cosmos = require('@oraichain/cosmosjs').default;
const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream(process.cwd() + '/debug.log', {
  flags: 'a+'
});
const requestOutput = fs.createWriteStream(process.cwd() + '/output.log', {
  flags: 'a+'
});

const config = {};
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production') {
  config.path = `.env.${process.env.NODE_ENV}`;
}
const message = Cosmos.message;

require('dotenv').config(config);

const sleep = (timeout) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

exports.setAiRequest = async (oracleAddr, validatorList) => {
  const childKey = cosmos.getChildKey(process.env.MNEMONIC);
  const creator = cosmos.getAddress(childKey);
  const input = JSON.stringify({
    oracle_handle: {
      msg: {
        create_ai_request: {
          validators: validatorList,
          input: process.env.INPUT ? process.env.INPUT : "",
        }
      }
    }
  })
  const txBody = getHandleMessage(oracleAddr, Buffer.from(input), creator, process.env.REQUEST_FEES);
  try {
    const res = await cosmos.submit(childKey, txBody, 'BROADCAST_MODE_BLOCK', isNaN(process.env.TX_FEES) ? 0 : parseInt(process.env.TX_FEES), 5000000);
    console.log(res);
    // collect request id and prepare query to get results
    let requestId = res.tx_response.logs[0].events[1].attributes[2].value;
    console.log("request id: ", requestId);
    await queryRequestResult(parseInt(requestId), 0);
  } catch (error) {
    console.log('error: ', error);
    logFile.write(`timestamp: ${new Date()}\nError: ${util.format(error)}\n\n`);
  }
};

const getHandleMessage = (contract, msg, sender, amount) => {
  const sent_funds = amount ? [{ denom: cosmos.bech32MainPrefix, amount: amount.toString() }] : null;
  const msgSend = new message.cosmwasm.wasm.v1beta1.MsgExecuteContract({
    contract,
    msg,
    sender,
    sent_funds
  });

  const msgSendAny = new message.google.protobuf.Any({
    type_url: '/cosmwasm.wasm.v1beta1.MsgExecuteContract',
    value: message.cosmwasm.wasm.v1beta1.MsgExecuteContract.encode(msgSend).finish()
  });

  return new message.cosmos.tx.v1beta1.TxBody({
    messages: [msgSendAny]
  });
};

const queryRequestResult = async (requestId) => {
  let count = 0;
  let queryMsg = JSON.stringify({
    oracle_query: {
      msg: {
        get_request: {
          request_id: requestId
        }
      }
    }
  })
  do {
    try {
      console.log("count: ", count);
      let { data } = await cosmos.get(`/wasm/v1beta1/contract/${process.env.AIORACLE_ADDR}/smart/${Buffer.from(queryMsg).toString('base64')}`);
      console.log("data status: ", data.status);
      // if successful => process
      if (data.status) {
        console.log("result reports: ", data.reports);
        let aggregatedResult = "";
        // collect the first report
        for (let report of data.reports) {
          if (report.status) {
            aggregatedResult = Buffer.from(report.aggregated_result, 'base64').toString('ascii');
            break;
          }
        }
        // if all reports have false status => something wrong, must throw error
        if (aggregatedResult === "") throw "Cannot collect any valid aggregated result from the validators";
        requestOutput.write(`timestamp: ${new Date()}\nPricefeed aggregated result of request id ${requestId}: ${util.format(aggregatedResult)}\n\n`);
        return;
      }
      await sleep(parseInt(process.env.QUERY_SLEEP_INTERVAL) || 10000);
      count++;
      continue;
    } catch (error) {
      // if status is false, sleep then continue to query again
      await sleep(parseInt(process.env.QUERY_SLEEP_INTERVAL) || 10000);
      count++;
      continue;
    }
  } while (count < (parseInt(process.env.QUERY_COUNT) || 20));

  // if we can get out of the do-while loop => throw error
  throw `Cannot collect any results from the validators with request id: ${requestId}`
}