import React, { useState, useEffect } from "react";
import { Button, Box, Typography, CircularProgress } from "@material-ui/core";
import { Link, Backdrop, makeStyles } from "@material-ui/core";
import { ethers } from "ethers";
import { useAccount, useNetwork, useSigner } from "wagmi";
import { signERC2612Permit } from 'eth-permit';
import { Biconomy } from "@biconomy/mexa";
import useGetQuoteFromNetwork from "../hooks/useGetQuoteFromNetwork";
import {
  getConfig,
  ExternalProvider,
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
} from "../utils";

let biconomy: any;

const target = "0x4C38C80c24bCE040f9CD852021ea903DE667D2Ad";
const underlying = "0x9b395d973b115d9afE467203E082A06570fFBd19";
const factory = "0x2A009e661979c4fB2D5423549575A4f2516B6Ac6";

function App() {
  const classes = useStyles();
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();

  const [backdropOpen, setBackdropOpen] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");
  const [newQuote, setNewQuote] = useState("");
  const [metaTxEnabled] = useState(true);
  const [transactionHash, setTransactionHash] = useState("");
  const [config, setConfig] = useState(getConfig("").configEIP2771);

  useEffect(() => {
    const conf = getConfig(chain?.id.toString() || "").configEIP2771;
    setConfig(conf);
  }, [chain?.id]);

  const { quote, owner, fetchQuote } = useGetQuoteFromNetwork(
    config.contract.address,
    config.contract.abi
  );

  useEffect(() => {
    const initBiconomy = async () => {
      setBackdropOpen(true);
      setLoadingMessage("Initializing Biconomy ...");
      biconomy = new Biconomy((signer?.provider as any).provider, {
        apiKey: config.apiKey.prod,
        debug: true,
        contractAddresses: [config.contract.address],
      });
      await biconomy.init();
      setBackdropOpen(false);
    };
    if (address && chain && signer?.provider) initBiconomy();
  }, [address, chain, config, signer?.provider]);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setTransactionHash("");
    if (!address) {
      showErrorMessage("Please connect wallet");
      return;
    }
    if (!newQuote) {
      showErrorMessage("Please enter the quote");
      return;
    }
    setTransactionHash("");
    if (metaTxEnabled) {
      showInfoMessage(`Getting user signature`);
      sendTransaction(address!, newQuote);
    } else {
      console.log("Sending normal transaction");
      // let tx = await contract.setQuote(newQuote, {
      //   from: address,
      // });
      // setTransactionHash(tx.transactionHash);
      // tx = await tx.wait(1);
      // console.log(tx);
      showSuccessMessage("Transaction confirmed");
      fetchQuote();
    }
  };

  const sendTransaction = async (userAddress: string, arg: string) => {
    try {
      showInfoMessage(`Sending transaction via Biconomy`);
      const provider = await biconomy.provider;
      const contractInstance = new ethers.Contract(
        config.contract.address,
        config.contract.abi,
        biconomy.ethersProvider
      );

      const value = ethers.utils.parseEther("1").toString();

      const result = await signERC2612Permit(provider, underlying, address!, factory, value);

      let { data } = await contractInstance.populateTransaction.depositWithPermit(
          ethers.utils.parseEther("1"),
          address,
          result.deadline,
          result.v,
          result.r,
          result.s
        );
      let txParams = {
        data: data,
        to: config.contract.address,
        from: "0x6E61Bef7CCff17367c5f5577164447A7623A33f6",
        signatureType: "EIP712_SIGN",
        gasLimit: 5000000,
      };
      console.log("txParams", txParams);
      const tx = await provider.send("eth_sendTransaction", [txParams]);
      console.log(tx);
      biconomy.on("txHashGenerated", (data: any) => {
        console.log(data);
        showSuccessMessage(`tx hash ${data.hash}`);
      });
      biconomy.on("txMined", (data: any) => {
        console.log(data);
        showSuccessMessage(`tx mined ${data.hash}`);
        fetchQuote();
      });
    } catch (error) {
      fetchQuote();
      console.log(error);
    }
  };

  return (
    <div className="App">
      <section className="main">
        <div className="flex">
          <p className="mb-author">Quote: {quote}</p>
        </div>

        <p className="mb-author">Quote owner: {owner}</p>
        {address?.toLowerCase() === owner?.toLowerCase() && (
          <cite className="owner">You are the owner of the quote</cite>
        )}
        {address?.toLowerCase() !== owner?.toLowerCase() && (
          <cite>You are not the owner of the quote</cite>
        )}
      </section>
      <section>
        {transactionHash !== "" && (
          <Box className={classes.root} mt={2} p={2}>
            <Typography>
              Check your transaction hash
              <Link
                href={`https://kovan.etherscan.io/tx/${transactionHash}`}
                target="_blank"
                className={classes.link}
              >
                here
              </Link>
            </Typography>
          </Box>
        )}
      </section>
      <section>
        <div className="submit-container">
          <div className="submit-row">
            <input
              type="text"
              placeholder="Enter your quote"
              onChange={(event) => setNewQuote(event.target.value)}
              value={newQuote}
            />
            <Button variant="contained" color="primary" onClick={onSubmit}>
              Submit
            </Button>
            {/* <Button
              variant="contained"
              color="primary"
              onClick={onSubmitWithPrivateKey}
              style={{ marginLeft: "10px" }}
            >
              Submit (using private key)
            </Button> */}
          </div>
        </div>
      </section>
      <Backdrop
        className={classes.backdrop}
        open={backdropOpen}
        onClick={() => setBackdropOpen(false)}
      >
        <CircularProgress color="inherit" />
        <div style={{ paddingLeft: "10px" }}>{loadingMessage}</div>
      </Backdrop>
    </div>
  );
}

export default App;

const useStyles = makeStyles((theme) => ({
  root: {
    "& > * + *": {
      marginLeft: theme.spacing(2),
    },
  },
  link: {
    marginLeft: "5px",
  },
  main: {
    padding: 20,
    height: "100%",
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff",
    opacity: ".85!important",
    background: "#000",
  },
}));
