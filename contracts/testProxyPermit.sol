// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Context.sol";

interface PermitInterface {
    function permit(
        address owner,
        address spender,
        uint value,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external;
}

contract TestProxyPermit is Context {

    address public constant permitToken = 0x9b395d973b115d9afE467203E082A06570fFBd19;
    PermitInterface PermitContract = PermitInterface(permitToken);

    constructor() {}

    function depositWithPermit(
        uint256 assets,
        address receiver,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public returns (uint256) {
        uint256 shares = assets;

        PermitContract.permit(
            _msgSender(),
            address(this),
            shares,
            deadline,
            v,
            r,
            s
        );

        PermitContract.transferFrom(_msgSender(), receiver, shares);
        return shares;
    }
}