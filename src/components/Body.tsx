/* eslint-disable react/jsx-pascal-case */
import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import Web3_Custom_EIP712Sign from './Web3_Custom_EIP712Sign';
import Web3_Custom_PersonalSign from "./Web3_Custom_PersonalSign";
import Web3_EIP2771_EIP712Sign from './Web3_EIP2771_EIP712Sign';
import Web3_EIP2771_PersonalSign from './Web3_EIP2771_PersonalSign';

import Ethers_Custom_EIP712Sign from './Ethers_Custom_EIP712Sign';
import Ethers_Custom_PersonalSign from './Ethers_Custom_PersonalSign';
import Ethers_EIP2771_EIP712Sign from './Ethers_EIP2771_EIP712Sign';
import Ethers_EIP2771_PersonalSign from './Ethers_EIP2771_PersonalSign';
// import Ethers_Forward_EIP712Sign from './Ethers_Forward_EIP712Sign';

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      className="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index: any) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`,
  };
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    display: "flex",
    width: "max-content",
    margin: "auto",
    height: 700,
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

function App() {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: any, newValue: any) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        aria-label="Vertical tabs"
        className={classes.tabs}
      >
        <Tab label="Web3 + Custom + EIP712 Sign" {...a11yProps(0)} />
        <Tab label="Web3 + Custom + Personal Sign" {...a11yProps(1)} />
        <Tab label="Web3 + EIP2771 + EIP712 Sign" {...a11yProps(2)} />
        <Tab label="Web3 + EIP2771 + Personal Sign" {...a11yProps(3)} />
        <Tab label="Ethers + Custom + EIP712 Sign" {...a11yProps(4)} />
        <Tab label="Ethers + Custom + Personal Sign" {...a11yProps(5)} />
        <Tab label="Ethers + EIP2771 + EIP712 Sign" {...a11yProps(6)} />
        <Tab label="Ethers + EIP2771 + Personal Sign" {...a11yProps(7)} />
        {/* <Tab label="Ethers + Forward + EIP712 Sign" {...a11yProps(8)} /> */}
      </Tabs>

      <TabPanel value={value} index={0}>
        <Web3_Custom_EIP712Sign />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Web3_Custom_PersonalSign />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Web3_EIP2771_EIP712Sign />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Web3_EIP2771_PersonalSign />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <Ethers_Custom_EIP712Sign />
      </TabPanel>
      <TabPanel value={value} index={5}>
        <Ethers_Custom_PersonalSign/>
      </TabPanel>
      <TabPanel value={value} index={6}>
        <Ethers_EIP2771_EIP712Sign />
      </TabPanel>
      <TabPanel value={value} index={7}>
        <Ethers_EIP2771_PersonalSign />
      </TabPanel>
    </div>
  );
}

export default App;
