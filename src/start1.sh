#!/bin/bash

export external_ip=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -n 1)

DEBUG=* node src/cli.js --path .raft/data1 --id id1 --port 8041 --peers "[{\"id\":\"id1\", \"url\":\"tcp://$external_ip:8041\", \"www\":\"http://$external_ip:8042\", \"pub\":\"http://$external_ip:8043\"},{\"id\":\"id2\", \"url\":\"tcp://$external_ip:8051\", \"www\":\"http://$external_ip:8052\", \"pub\":\"http://$external_ip:8053\"},{\"id\":\"id3\", \"url\":\"tcp://$external_ip:8061\", \"www\":\"http://$external_ip:8062\", \"pub\":\"http://$external_ip:8063\"}]"
