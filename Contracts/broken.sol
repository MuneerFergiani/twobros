// contracts/BroToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TeamToken is ERC20 {

    mapping (address => uint256) lastMintTimes;

    uint256 constant MINT_COOLDOWN = 1;
    uint32 constant MINT_AMOUNT = 10;

    uint32[] puzzleAnswers = [2, 4, 8, 16, 32];

    event Solve(address indexed from, uint256 puzzleIndex, uint256 amount);


    constructor() ERC20("Team", "T") {
        
    }

    function Mint() external
    {
        require(totalSupply() - balanceOf(address(this)) <= 50, "total supply reached");
        uint256 count = (block.timestamp - lastMintTimes[msg.sender]) / MINT_COOLDOWN;
        require(count > 0, "you're mint is on cool down!");
        _mint(msg.sender, MINT_AMOUNT);
        lastMintTimes[msg.sender] = block.timestamp;
    } 

    function solve(uint256 puzzleIndex, uint32 answer) external
    {
        if(puzzleIndex < puzzleAnswers.length && puzzleAnswers[puzzleIndex] == answer)
        {
            emit Solve(msg.sender, puzzleIndex, balanceOf(msg.sender));
        }
        else 
        {
            transfer(address(this), balanceOf(msg.sender));
        }

    }
}