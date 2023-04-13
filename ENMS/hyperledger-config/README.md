this is a modified network used for local development heavily based upon the open source hyperledger test network,
everything under the hyperledger-config directory is under the Apache license, and is used solely for the purposes of rapid
local development, it can be used for commercial purposes but is not recommended. It is our recommendation to deploy with
the help of a hyperledger provider such as IBM or ChainStack while continuing to use this network for local development.

Date:
Sunday, April 9th 2023

this is a network used for local development heavily based upon the open source hyperledger test network

For more information, see [Using the Fabric test network](https://hyperledger-fabric.readthedocs.io/en/latest/test_network.html).

# To authenticate enms API:

1. Copy hyperledger fabric binaries to ./bin folder
2. Add bin folder to path
3. ./network.sh up -s couchdb
4. copy ENMS\hyperledger-config\organizations\peerOrganizations\org1.example.com\connection-org1.json to ENMS\enms-api\admin
5. npm start ( enms api )
