#!/bin/bash
export LC_ALL=C
clear
if ps -edaf | grep mongo | grep -v grep > /dev/null;
then
    echo "Mongodb is already running"
else
    mongod -fork --logpath /dev/null
fi

