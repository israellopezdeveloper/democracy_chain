#!/bin/bash

cat ../../test_wallet.txt | grep "Password: " | sed 's/Password: \(.*\)/\1/'
