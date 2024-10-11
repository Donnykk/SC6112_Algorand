const algosdk = require("algosdk");
const fs = require("fs");
const path = require("path");

const algodClient = new algosdk.Algodv2(process.env.ALGOD_TOKEN, process.env.ALGOD_SERVER, process.env.ALGOD_PORT);

const submitToNetwork = async (signedTxn) => {
    // send txn
    let tx = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction : " + tx.txId);

    // Wait for transaction to be confirmed
    confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

    //Get the completed Transaction
    console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    return confirmedTxn;
};

const generateLogicSig = async (signer, args) => {
    // Compile TEAL code
    const filePath = path.join(__dirname, "../assets/main.teal");
    const data = fs.readFileSync(filePath);
    const compiledProgram = await algodClient.compile(data).do();

    // Convert program to bytecode
    const programBytes = new Uint8Array(Buffer.from(compiledProgram.result, "base64"));

    // Create logic signature from bytecode and arguments
    const lsig = new algosdk.LogicSigAccount(programBytes, args);
    lsig.sign(signer.sk);

    return lsig;
}

(async () => {
    // Accounts involved
    const sender = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);
    const acc1 = algosdk.mnemonicToSecretKey(process.env.ACC1_MNEMONIC);
    const acc2 = algosdk.mnemonicToSecretKey(process.env.ACC2_MNEMONIC);

    // get suggested parameters
    let suggestedParams = await algodClient.getTransactionParams().do();

    // send txn calling function A
    console.log("Calling function A...");
    const minAlgos = 5;
    const txn1args = [Buffer.from("functionA"), algosdk.encodeUint64(minAlgos)];
    const lsigA = await generateLogicSig(sender, txn1args);
    const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: lsigA.address(),
        to: acc1.addr,
        amount: minAlgos * 1e6, // Provide min number of Algos
        suggestedParams,
    });

    const signedTxn1 = algosdk.signLogicSigTransactionObject(txn1, lsigA);
    await submitToNetwork(signedTxn1.blob);

    // send txn calling function B
    console.log("Calling function B...");
    const txn2args = [Buffer.from("functionB")];
    const lsigB = await generateLogicSig(sender, txn2args);
    const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: lsigB.address(),
        to: acc2.addr,
        amount: 1e6, // 1 Algo
        suggestedParams,
    });

    const signedTxn2 = algosdk.signLogicSigTransactionObject(txn2, lsigB);
    await submitToNetwork(signedTxn2.blob);
})();
