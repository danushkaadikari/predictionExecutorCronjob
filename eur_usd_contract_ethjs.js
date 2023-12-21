const fs = require('fs');
const {Web3} = require("web3");

const alchemyApiKey = 'Alchemy API Key Here';
const contractAddress = '0xdc3fffc956a1f6d8e644b42ff56ac57940f2b0df';
const abiFilePath = '/home/ubuntu/cronjobLumanagi/LumanagiPredictionV1Abi.json'; // Replace with the path to your ABI JSON file
const functionName = 'executeRoundManual';
const currentEpochFunction = 'currentEpoch';
const roundsFunction = 'rounds';
const privateKey = 'Enter Private Key Here'; // Replace with your private key

const abi = JSON.parse(fs.readFileSync(abiFilePath, 'utf-8'));
const web3 = new Web3(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`);
const contract = new web3.eth.Contract(
    abi,
    contractAddress
);

const functionParams = []; // Replace with your function parameters
// Get the sender's address from the private key
contract.methods[currentEpochFunction](...functionParams)
    .call()
    .then((result) => {
        contract.methods[roundsFunction](result -BigInt(1))
            .call()
            .then((result) => {
                const currentTimeUnix = Math.floor(new Date().getTime() / 1000);
                const bufferSeconds = BigInt(60);
                if (BigInt(currentTimeUnix) >= result.closeTimestamp && (BigInt(currentTimeUnix) < (result.closeTimestamp + bufferSeconds))){
                    const senderAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;
                    contract.methods[functionName](...functionParams).estimateGas({ from: senderAddress })
                        .then((gasEstimate) => {
                            // Build the transaction object
                            const transactionObject = {
                                from: senderAddress,
                                to: contractAddress,
                                gas: gasEstimate,
                                gasPrice: web3.utils.toWei('200', 'gwei'), // Adjust the gas price based on network conditions
                                data: contract.methods[functionName](...functionParams).encodeABI(),
                            };
                            return web3.eth.accounts.signTransaction(transactionObject, privateKey);
                        })
                        .then((signedTransaction) => {
                            // Send the signed transaction
                            return web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
                        })
                        .then((receipt) => {
                            console.log('Transaction sent. Transaction Hash:', receipt.transactionHash);
                        })
                        .catch((error) => {
                            console.error('Error sending transaction:', error);
                        });
                }else{
                    console.log('TimeStamp not met')
                }
            })
            .catch((error) => {
                console.error('Error calling function rounds:', error);
            });
    })
    .catch((error) => {
        console.error('Error calling function CurrentEpoch:', error);
    });
