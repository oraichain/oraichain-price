import Cosmos from '@oraichain/cosmosjs';
import KSUID from 'ksuid';
import Long from 'long';
import fs from 'fs';
import util from 'util';
const log_file = fs.createWriteStream(__dirname + '/debug.log', { flags: 'a+' });

const config = {};
if (process.env.NODE_ENV !== 'production') {
    config.path = `.env.${process.env.NODE_ENV}`;
}
require('dotenv').config(config);

const message = Cosmos.message;
const cosmos = new Cosmos(process.env.LCD_URL, process.env.CHAIN_ID);
cosmos.setBech32MainPrefix('orai');
const childKey = cosmos.getChildKey(process.env.MNEMONIC);
const creator = childKey.identifier;

export const setAiRequest = async (oscriptName, count) => {
    const req_id = KSUID.randomSync().string;
    // get accAddress in binary
    const fees = process.env.FEES || '1orai';
    const input = '';
    const expectedOutput = '';
    const msgSend = new message.oraichain.orai.airequest.MsgSetAIRequest({
        request_id: req_id,
        oracle_script_name: oscriptName,
        creator,
        validator_count: new Long(count),
        fees,
        input: Buffer.from(input),
        expected_output: Buffer.from(expectedOutput)
    });

    const msgSendAny = new message.google.protobuf.Any({
        type_url: '/oraichain.orai.airequest.MsgSetAIRequest',
        value: message.oraichain.orai.airequest.MsgSetAIRequest.encode(msgSend).finish()
    });

    const txBody = new message.cosmos.tx.v1beta1.TxBody({
        messages: [msgSendAny],
        memo: ''
    });

    try {
        const response = await cosmos.submit(childKey, txBody, 'BROADCAST_MODE_BLOCK', 0, 300000);
        console.log(response);
        if (response.tx_response.code !== 0) throw Error(response.tx_response.raw_log);
        console.log('request id: ', req_id);
    } catch (ex) {
        console.error(ex);
        log_file.write(`timestamp: ${new Date()} with ${util.format(ex)}` + '\n\n\n');
    }
}