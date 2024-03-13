import logo from './logo.svg';
import './App.css';
import { AnchorWallet, ConnectionProvider, WalletProvider, useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { WalletDisconnectButton, WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PythSolanaReceiver, InstructionWithEphemeralSigners } from '@pythnetwork/pyth-solana-receiver';
import { Connection, PublicKey } from '@solana/web3.js';
import * as buffer from "buffer";
import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import { MyFirstPythApp, IDL } from './idl/my_first_pyth_app';
// import IDL from "./idl/my_first_pyth_app.json";
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
window.Buffer = buffer.Buffer;

require('@solana/wallet-adapter-react-ui/styles.css');

const SOL_PRICE_FEED_ID = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
const ETH_PRICE_FEED_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
const BTC_PRICE_FEED_ID = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
async function postPriceUpdate(connection: Connection, wallet: AnchorWallet | undefined) {
  if (wallet === undefined) {

    return
  }
  else {
    const priceServiceConnection = new PriceServiceConnection("https://hermes.pyth.network/", { priceFeedRequestConfig: { binary: true } });
    const pythSolanaReceiver = new PythSolanaReceiver({ connection, wallet });

    const priceUpdateData = await priceServiceConnection.getLatestVaas([SOL_PRICE_FEED_ID, ETH_PRICE_FEED_ID]);

    const myFirstApp = new Program<MyFirstPythApp>(IDL as MyFirstPythApp, new PublicKey("2e5gZD3suxgJgkCg4pkoogxDKszy1SAwokz8mNeZUj4M"), new AnchorProvider(connection, wallet, { commitment: "processed" }))

    const transactionBuilder = pythSolanaReceiver.newTransactionBuilder();
    await transactionBuilder.withPostPriceUpdates(priceUpdateData);
    await transactionBuilder.withPriceConsumerInstructions(async (priceFeedIdToPriceAccount: Record<string, PublicKey>): Promise<InstructionWithEphemeralSigners[]> => {
      return [{
        instruction: await myFirstApp.methods.initialize(new BN(1))
          .accounts({ destination: new PublicKey("BTwXQZS3EzfxBkv2A54estmn9YbmcpmRWeFP4f3avLi4"), priceUpdate: priceFeedIdToPriceAccount[SOL_PRICE_FEED_ID] })
          .instruction(),
        signers: []
      }]
    });
    transactionBuilder.withCloseInstructions();

    await pythSolanaReceiver.provider.sendAll(await transactionBuilder.getVersionedTransactions({}), { skipPreflight: true });
  }

}

function Button() {

  const connection = new Connection("https://api.devnet.solana.com");
  const anchorWallet = useAnchorWallet();

  return <button onClick={async () => {
    console.log("Press")
    await postPriceUpdate(connection, anchorWallet)
  }}>
    Send
  </button>
}

function App() {

  // const [currentVaa, setCurrentVaa] = useState<string | undefined>(undefined); 

  // const priceServiceConnection = new PriceServiceConnection("https://hermes.pyth.network/", {priceFeedRequestConfig : {binary : true}});
  // priceServiceConnection.subscribePriceFeedUpdates(["0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"], (update)=> {
  //   setCurrentVaa(update.vaa);
  // })
  return (
    <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>

          <div className="App">
            <header className="App-header">
              <img src={logo} className="App-logo" alt="logo" />
              <WalletMultiButton />
              <WalletDisconnectButton />
              <p>
                Edit <code>src/App.tsx</code> and save to reload.
              </p>
              <Button></Button>
            </header>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>

  );
}

export default App;
