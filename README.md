## EFNPro's NFT and Contract management system

# Group 3: Paola Val, Owen Stadlwieser, Louie Xie

This project uses Hyperledger Fabric to deploy an NFT, and Contract
Management system backed by blockchain.

# Deployed

We also have a deployed version upon which you can test, it is connected to the hosted chaincode on an IBM blockchain platform, and an ec2 instance:
http://54.226.24.182:1025

# When Testing keep in mind

1. Use any email for the artist, we have set up an account with credentials:
   1. Username: rand@rand.mmm
   2. Password: Test1234!
2. Use a personal email for the client such that you can recieve the email which contains secure token to signup and view nfts
   1. Dont use ualberta as we have issues with the email firewall
3. Large images chosen as the display image for nft may fail if they are larger than aws ec2 max payload size
4. Large files for milestones will work as they utilize stream uploads

# Run locally

Before everything:

1. https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html

Get EVERYTHING MANDATORY HERE!!! ^^^^^ Before you start.

Get Repo:
Download the consolidated repo for ENMS and EFNPro: CapstoneConsolidated

2. cd ~/ENMS/chain-code
3. npm i

Set Test Network: (Follow the instruction on Fabric Document to get the binaries: version: latest)
Link: https://hyperledger-fabric.readthedocs.io/en/latest/install.html

4. Install.1: curl the install-fabric.sh "curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh"

5. Install.2: ./install-fabric b %% this is to get the binary file
6. Then copy the binary right to the place in /ENMS/hyperledger-config/bin.

7. RUN: export PATH=${PWD}/bin:$PATH from hyperledger-config directory to add binaries to path
8. Change the directory to ~/ENMS/hyperledger-config
9. Create .env in hyperledger-config/
10. Create .env in hyperledger-config/compose/
11. Content for both:

# BEGIN ENV

FABRIC_CA_ADMIN_PW=adminpw

# END ENV

12. Copy Hyperledger Fabric Binary File to /bin folder
13. Copy /bin into ~/ENMS/hyperledger-config: you get ~/ENMS/hyperledger-config/bin

14. Command line: ./network.sh down
15. Command line: ./network.sh up -s couchdb
16. Create a Channel: ./network.sh createChannel -c mychannel
17. Deploy the chain-code: ./network.sh deployCC -ccn basic -ccp ../chain-code/ -ccl typescript -c mychannel

    mychannel is the current channel name
    basic is the current chaincode name

18. Update CHANNEL_NAME and CHAINCODE_NAME in the following .env in /enms-api/dist if they are ever changed.

<— Now the chaincode is successfully deployed —
— we next to start ENMS-API server —> 19. copy ENMS\hyperledger-config\organizations\peerOrganizations\org1.example.com\connection-org1.json to ENMS\enms-api\admin (This json file is generated if you deployed the chaincode correctly) 20. Delete the square brackets (line 42 array brackets) in the copied file for certificateAuthorities.org.tlsCACerts.pem 21. Navigate to ~/ENMS/enms-api 22. Run: npm install, then npm i typescript -global 23. Run: npm build 24. Create .env in enms-api/dist file with following fields, this env obviously contains some private keys, we share these with you for the pupose
of accessing our dev environment. If you wish to set up your own keys for these services, feel free.

# BEGIN ENV

DB_PASSWORD=SISQ3kjDMd0fe0IJ
DB_USERNAME=ostadlwi
DATABASE=mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@cluster0.geyfzja.mongodb.net/?retryWrites=true&w=majority
API_KEY=oSm3LmbbXGXSLA24jRfWflcd0oogloff
CHANNEL_NAME=mychannel
CHAINCODE_NAME=basic
ORG_NAME=org1
API_ADMIN_ORG1_USER=admin
API_ADMIN_ORG1_PW=adminpw
NODE_ENV=DEV
SMTP_HOST = "smtp.gmail.com"
SMTP_SERVICE = "google"
SMTP_PORT = 465
SMTP_USER = "efnpro.test@gmail.com"
SMTP_PASS = "qkrpwnisylcmatmc"
SMTP_SECURE = true
SMTP_REQUIRE_TLS = true
ENMS_CLIENT_SIGNUP_URL = "http://localhost:2500/resetKey"
ENMS_LOGIN_URL = "http://localhost:2500/login"
CLIENT_SECRET=Test1234!
SESSION_SECRET=secret
FILE_STORAGE_DEFAULT_ENDPOINTS_PROTOCOL = "https"
FILE_STORAGE_KEY="gQh8fymN5lXAx3/uiZdtwGlCU7p9O+2FYPVLlTfpXnllic9CrI3CjP0ypW3kjIyD43GxUzJq8jQz+AStaD0pig=="
FILE_STORAGE_ACCOUNT_NAME="enmsblobstorage"
FILE_STORAGE_ENDPOINT_SUFFIX="core.windows.net"
FILE_STORAGE_BLOB_CONTAINER_NAME = "enmsblobcontainer"
CLIENT_URL="http://localhost:2500"
EXPIRY_TIME=3600000
URL_EXPIRY_IN_MINUTES=3600000

# END ENV

25. Run npm run watch
26. Run npm run dev in separate terminal

<— Now ENMS-API is successfully deployed with required components—
— we next to start EFNPro frontend—>

27. Start EFNPro Instruction:
    -1. Npm install
    -2. npm i typescript -global
    -3. npm start
28. Navigate the CapstoneConsolidated/efn-pro
29. Create .env

# BEING ENV

ENMS_URL="http://localhost:3000"
PORT=2500

# END ENV

Run: npm start

It should work now.

Troubleshooting:

1.  Npm error: make sure using the latest version of node:
    Run: nvm use node
2.  ERROR: sudo: ./network.sh: command not found
    Run: chmod +x network.sh (Extension: if any .sh script failed, run this; or chmod +x scripts/\_)
3.  While creating channel [at Step 8]:
    Error response from daemon: error while creating mount source path '~/CapstoneConsolidated/ENMS/hyperledger-config/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp': mkdir ~/Documents/CapstoneConsolidated/ENMS/hyperledger-config/organizations/ordererOrganizations/example.com/orderers/orderer.example.com: operation not permitted
4.  Permissions on macOS for org peer creation while ./network.up: (if you ever encounter this problem, you probably need to do it twice.)
    sudo chmod -R ug+rwx ~/ENMS-MyChaincode/ENMS/hyperledger-config/\_
    Redo the instruction you failed. Such as the channel creation process.

5.                       If chaincode has any update. Redeploy the chaincode.  [STEP 5]

    This requires updating your channel name [STEP 9] and probably recopy the config file. [STEP 7]\*\*\*

6.  There is a seperate doc on the shared drive with indepent instructions which may prove helpful if you are stuck
