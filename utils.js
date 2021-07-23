import Cosmos from '@oraichain/cosmosjs';
import fs from 'fs';
const log_file = fs.createWriteStream(__dirname + '/debug.log', {
  flags: 'a+'
});

declare var cosmos: Cosmos;

const config = {};
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production') {
  config.path = `.env.${process.env.NODE_ENV}`;
}
const message = Cosmos.message;

require('dotenv').config(config);

export const setAiRequest = async (oracleAddr, validatorList) => {
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
  const txBody = getHandleMessage(oracleAddr, Buffer.from(input), creator, process.env.FEES);
  try {
    const res = await cosmos.submit(childKey, txBody, 'BROADCAST_MODE_BLOCK', isNaN(process.env.TX_FEES) ? 0 : parseInt(process.env.TX_FEES), 5000000);
    console.log(res);
  } catch (error) {
    console.log('error: ', error);
  }
};

const getHandleMessage = (contract, msg, sender, amount) => {
  const sent_funds = amount ? [{ denom: cosmos.bech32MainPrefix, amount }] : null;
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