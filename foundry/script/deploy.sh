#!/bin/bash

source ../../telegram-service/.env

forge create --rpc-url $RPC --chain $CHAINID \
    --constructor-args $DEPLOYER_ADDRESS \
    --private-key $DEPLOYER_PRIVATE_KEY \
	ChatChampion

#	--verify \
#	--etherscan-api-key $ETHERSCAN_API_KEY \
