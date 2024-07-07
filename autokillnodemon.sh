#!/bin/bash

# Get all nodemon process IDs
PIDS=$(ps aux | grep '[n]odemon' | awk '{print $2}')

# Kill each nodemon process
for PID in $PIDS
do
    kill -9 $PID
    echo "Killed nodemon process: $PID"
done
