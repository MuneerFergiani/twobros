import * as THREE from 'three';
import { lerp } from 'three/src/math/MathUtils';
import {
    EVMAssetTransfer,
    Environment,
    getTransferStatusData,
  } from "@buildwithsygma/sygma-sdk-core";

import { ethers, Wallet } from "ethers";


const SEPOLIA_CHAIN_ID = 11155111;
const RESOURCE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000300";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

let mint_tokens = 0;


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const powerUpTime = 1;
const maxPowerTime = powerUpTime + 0.5;
var clock = new THREE.Clock();
let scale = 2;
let isPointerDown = false;
let canMint = false;

document.body.getElementsByClassName("bridge_button").onclick = erc20Transfer;

function pointerdown()
{
    isPointerDown = true;
}
const getStatus = async (txHash) =>
{
    try {
      const data = await getTransferStatusData(Environment.TESTNET, txHash);
  
      return data;
    } catch (e) {
      console.log("error:", e);
    }
};



export async function erc20Transfer(){
    const provider = new ethers.providers.JsonRpcProvider(
        "https://goerli.infura.io/v3/180ca7ada62248b5832c4802f055a7a0"
    );
    const wallet = new Wallet("b9425c10e064321d9a06e7263e4814ffed23bd2379a5a574088b681514a5ac2e", provider);
    const assetTransfer = new EVMAssetTransfer();
    // @ts-ignore-next-line
    await assetTransfer.init(provider, Environment.TESTNET);
  
    const transfer = await assetTransfer.createFungibleTransfer(
      await wallet.getAddress(),
      SEPOLIA_CHAIN_ID,
      await wallet.getAddress(), // Sending to the same address on a different chain
      RESOURCE_ID,
      "50000000000000000000" // 18 decimal places
    );
  
    const fee = await assetTransfer.getFee(transfer);
    const approvals = await assetTransfer.buildApprovals(transfer, fee);
    for (const approval of approvals) {
      const response = await wallet.sendTransaction(
        approval
      );
      console.log("Sent approval with hash: ", response.hash);
    }
    const transferTx = await assetTransfer.buildTransferTransaction(
      transfer,
      fee
    );
    const response = await wallet.sendTransaction(
      transferTx 
    );
    console.log("Sent transfer with hash: ", response.hash);
  
    let dataResponse = { status : "", explorerUrl: "" };
  
    const id = setInterval(() => {
      getStatus(response.hash)
        .then((data) => {
          if (data) {
            dataResponse = data;
            console.log("Status of the transfer", data.status);
          }
        })
        .catch((e) => {
          console.log("error:", e);
          console.log("Transfer still not indexed, retrying...");
        });
  
      if (dataResponse && dataResponse.status === "executed") {
        console.log("Transfer executed successfully");
        clearInterval(id);
        process.exit(0);
      }
    }, 5000);
  }
  
  erc20Transfer().finally(() => {});

async function pointerup()
{
    if(canMint)
    {
        console.log("mint");
        console.log(document.body.getElementsByTagName('p')[1].textContent = "Tokens: " + mint_count);
        mint_tokens += 1;
    }
    isPointerDown = false;
    canMint = false;
    reset();
    updateCube();
}   

window.addEventListener( 'pointerdown', pointerdown );
window.addEventListener( 'pointerup', pointerup );

// geometrey
let green = { color: 0x00ff00 } ;
let red = { color: 0xff0000 } ;


const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const red_material = new THREE.MeshLambertMaterial(red);
const green_material = new THREE.MeshLambertMaterial(green);
const light = new THREE.AmbientLight(new THREE.Color({color: 0xffffff}));
const dirlight = new THREE.DirectionalLight(new THREE.Color({color: 0xffffff}));
const cube = new THREE.Mesh( geometry, red_material );
scene.add( cube );
scene.add( light );
scene.add( dirlight );

camera.position.z = 5;

let currentPowerUpTime = 0;

let cube_scale = 0;
let dt = 0;
function updateCube()
{
    cube.rotateX(0.01);
    cube.rotateZ(0.01);
    let scaleAlpha = Math.min(currentPowerUpTime, powerUpTime) / powerUpTime;
    cube_scale = lerp(cube_scale, 1 + scaleAlpha * scale, 0.95*dt);
    cube.scale.setScalar(cube_scale);
}

function reset()
{
    isPointerDown = false;
    currentPowerUpTime = 0;
    canMint = false;
}

function animate() {
    if(currentPowerUpTime > powerUpTime)
    {
        cube.material = green_material;
        canMint = true;
    }
    else
    {
        cube.material = red_material;
    }
    dt = clock.getDelta();
    if(isPointerDown)
    {
        currentPowerUpTime += dt;
        if(currentPowerUpTime > maxPowerTime)
        {
            reset();
        }
    }
    updateCube();        
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}

animate();