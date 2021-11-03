## AI Oracle background

* The AI Oracle protocol developed by Oraichain allows users to run AI services such as AI pricefeed, face recognition, or OCR in a decentralized manner.

* Each service contains several data source scripts, which fetch external AI APIs to get the result.

* The Oraichain's validators execute the AI requests, aggregate, and return the results, which are already verified by test cases.

* Third party test case providers are responsible for the verification process, and are rewarded accordingly.

* Users can select any aggregated result provided by any validator for their services.

## AI pricefeed integration process

* To continuously and automatically request and collect tokens' prices using Oraichain, it is recommended to use Cosmosjs powered by Oraichain to easily interact with the network.

* There are three steps to finally retrieve the the tokens' prices:

### 1. Prepare the .env file

The .env file contains several key-value pairs below:

```bash
MNEMONIC=
LCD_URL=http://lcd.orai.io
CHAIN_ID=Oraichain
REQUEST_FEES=0
TX_FEES=0
AIORACLE_ADDR=orai16w8yw68wqfgdxvfn3hhspmj6452p3rvzjgqvx3
INTERVAL=240000
QUERY_SLEEP_INTERVAL=10000
QUERY_COUNT=20
```

where:

* ```MNEMONIC``` is your Oraichain mnemonic used to create AI pricefeed requests. Without this field, you will not be able to create an AI pricefeed request.

* ```LCD_URL``` is the Oraichain network's team endpoint used to query network data or broadcast transactions.

* ```CHAIN_ID``` is Oraichain chain id.

* ```REQUEST_FEES``` is the fees (in uorai) you need to pay per AI pricefeed request. Such fees will go directly toward the validators' and providers' wallets. At the moment, the validators charge no fees when creating an AI pricefeed request, so it is not necessary to specify the value of this key. Example when adding a value: ```REQUEST_FEES=10```, where 10 is 10uorai = 10 * 10^-6 ORAI.

* ```TX_FEES``` is the transaction fees (in uorai) of your requests. At the moment, all mainnet transactions cost no fees, 

* ```AIORACLE_ADDR``` is the AI pricefeed Oracle smart contract address.

* ```INTERVAL``` is the interval (in ms) for creating new AI pricefeed requests. Reducing this value will create more AI pricefeed requests within a period of time

* ```QUERY_SLEEP_INTERVAL``` is the sleep interval (in ms) when waiting for the results of an AI pricefeed request. Decreasing this value will reduce the time waiting for the results to come.

* ```QUERY_COUNT``` is the number of times you query the results of an AI pricefeed request. Decreasing this value will also reduce the time waiting for the pricefeed's results.

* ```COUNT``` is the validator count. The higher the value, the larger the number of validators needed to execute your request.

Using these pairs, you'll be able to manage your request time as well as the tokens you are willing to pay per request. 

### 2. Create a new AI request and collect its request ID

Creating a new AI pricefeed request requires a certain number of validators involving in the process. At the moment, you can choose which validator to execute your request:

```js
const validators = await init();
const validatorList = randomValidators(validators, process.env.COUNT ? parseInt(process.env.COUNT) : 2);
```

next, create a new AI request:

```js
const aiOracleAddr = process.env.AIORACLE_ADDR;
await setAiRequest(aiOracleAddr, validatorList);
```

After creating a new AI request, collect its request ID:

```js
const res = await cosmos.submit(childKey, txBody, 'BROADCAST_MODE_BLOCK', isNaN(process.env.TX_FEES) ? 0 : parseInt(process.env.TX_FEES), 5000000);
console.log(res);
// collect request id and prepare query to get results
let requestId = res.tx_response.logs[0].events[1].attributes[2].value;
```

### 3. Query the request's result using the corresponding request ID

```js
let queryMsg = JSON.stringify({
    oracle_query: {
      msg: {
        get_request: {
          request_id: requestId
        }
      }
    }
  })

let { data } = await cosmos.get(`/wasm/v1beta1/contract/${process.env.AIORACLE_ADDR}/smart/${Buffer.from(queryMsg).toString('base64')}`);
```

when the status of the request is true, it means that the request has finally collected all results from the list of validators. The results are also ready to be extracted and used for your services.

## Demo

Type: ```NODE_ENV=production yarn start``` to start running the script. The request's results will be written into the ```output.log``` file, while all errors are put in the ```debug.log``` file.