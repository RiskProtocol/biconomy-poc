import React, { useState, useEffect } from "react";
import { Button, Box, Typography, CircularProgress } from "@material-ui/core";
import { Link, Backdrop, makeStyles } from "@material-ui/core";
import { ethers } from "ethers";
import { useAccount, useNetwork } from "wagmi";
import { signERC2612Permit } from 'eth-permit';
import {
  getConfig,
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
} from "../utils";

import {
  IPaymaster,
  IHybridPaymaster, 
  SponsorUserOperationDto,
  PaymasterMode,
  BiconomyPaymaster,
} from '@biconomy/paymaster';
import { IBundler, Bundler } from '@biconomy/bundler'
import { BiconomySmartAccount, BiconomySmartAccountConfig, DEFAULT_ENTRYPOINT_ADDRESS  } from "@biconomy/account";

const underlying = "0x9b395d973b115d9afE467203E082A06570fFBd19";


function App() {
  const classes = useStyles();
  const { address } = useAccount();
  const { chain } = useNetwork();

  const [backdropOpen, setBackdropOpen] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");
  const [amount, setAmount] = useState(1);
  const [metaTxEnabled] = useState(true);
  const [transactionHash, setTransactionHash] = useState("");
  const [config, setConfig] = useState(getConfig("").configUnderlying);
  const [smartAccount, setSmartAccount] = useState<any>(null);

  useEffect(() => {
    const conf = getConfig(chain?.id.toString() || "").configUnderlying;
    setConfig(conf);
  }, [chain?.id]);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setTransactionHash("");
    if (!address) {
      showErrorMessage("Please connect wallet");
      return;
    }
    if (!amount) {
      showErrorMessage("Please enter the quote");
      return;
    }
    setTransactionHash("");
    if (metaTxEnabled) {
      showInfoMessage(`Getting user signature`);
      sendTransaction(address!, amount);
    } else {
      console.log("Sending normal transaction");
      showSuccessMessage("Transaction confirmed");
    }
  };

  useEffect(() => {
    const initBiconomy = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
  
      const bundler: IBundler = new Bundler({
        bundlerUrl: "https://bundler.biconomy.io/api/v2/5/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
        chainId: 5,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      })
  
      const paymaster: IPaymaster = new BiconomyPaymaster({
        paymasterUrl: "https://paymaster.biconomy.io/api/v1/5/xqDT1kr7w.cc23bfc8-dd79-4c0d-b418-ec694a04fc1b",
      })
  
  
      const biconomySmartAccountConfig: BiconomySmartAccountConfig = {
        signer: signer,
        chainId: 5,
        bundler,
        paymaster,
      }
  
      let biconomySmartAccount = new BiconomySmartAccount(biconomySmartAccountConfig)
      biconomySmartAccount =  await biconomySmartAccount.init()
      console.log("Smart account address", await biconomySmartAccount.getSmartAccountAddress())
      setSmartAccount(biconomySmartAccount)
    }
    initBiconomy()
  }, [])

  const sendTransaction = async (userAddress: string, arg: number) => {
    try {
      showInfoMessage(`Sending transaction via Biconomy`);


      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();

      const contractInstance = new ethers.Contract(
        config.contract.address,
        config.contract.abi,
        signer
      );

      const value = ethers.utils.parseEther("1").toString();

      const result = await signERC2612Permit(provider, underlying, address!, config.contract.address, value);

      const deposit = await contractInstance.depositWithPermit(
          ethers.utils.parseEther("1"),
          address,
          result.deadline,
          result.v,
          result.r,
          result.s
      );

      console.log('deposit', deposit);

      console.log('result', result);

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
      };

      const biconomyPaymaster =
      smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
      let paymasterServiceData: SponsorUserOperationDto = {
        mode: PaymasterMode.SPONSORED,
      };


      console.log("here before userop")
      let userOp = await smartAccount.buildUserOp([txParams]);
      console.log({ userOp })
      const paymasterAndDataResponse =
        await biconomyPaymaster.getPaymasterAndData(
          userOp,
          paymasterServiceData
        );

      userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
      const userOpResponse = await smartAccount.sendUserOp(userOp);
      console.log("userOpHash", userOpResponse);
      const { receipt } = await userOpResponse.wait(1);
      console.log("txHash", receipt.transactionHash);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="App">
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
          <label>Enter Amount to deposit</label>
          <div className="submit-row">
            <input
              type="number"
              onChange={(event) => setAmount(parseFloat(event.target.value))}
              value={amount}
            />
            <Button variant="contained" color="primary" onClick={onSubmit}>
              Submit
            </Button>
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
